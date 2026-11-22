// The Velvet Vault — game state: nights, the alarm, winning and losing.
// One job: own the whole match — one update() per frame, one phase at a time.

import { ALARM, NIGHT_SECONDS, SCORE, VIEW_W, VIEW_H } from './config.js';
import { LEVELS, sightBlockers, moveBlockers } from './levels.js';
import { makeGuard, updateGuard, guardCatches } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import { makeThief, moveThief, collectCoins, nearestLoot, grabLoot } from './player.js';
import { keyToolBelt, clickToolBelt } from './tools.js';
import { dist } from './vision.js';
import * as sfx from './audio.js';

export const PHASES = {
  TITLE: 'title',
  PLAY: 'play',
  BUSTED: 'busted',
  ESCAPED: 'escaped',
  NIGHT_DONE: 'night-done',
};

export function makeGame() {
  return {
    phase: PHASES.TITLE,
    nightIndex: 0,
    level: null,
    guards: [],
    cameras: [],
    thief: null,
    loot: [],
    coins: [],
    blockers: [],
    sight: [],
    alarm: 0,
    timeLeft: NIGHT_SECONDS,
    now: 0,
    totalScore: 0,
    toast: '',
    toastUntil: 0,
    noisePing: null,
    smokeCloud: null,
    mouse: { x: 0, y: 0 },
    endReason: '',
    spottedFlash: 0,
    alarmTickAt: 0,
  };
}

export function loadNight(game, index) {
  const def = LEVELS[index];
  game.nightIndex = index;
  game.level = def;
  game.guards = def.guards.map(makeGuard);
  game.cameras = def.cameras.map(makeCamera);
  game.thief = makeThief(def.spawn);
  game.loot = def.loot.map((l) => ({ ...l, taken: false }));
  game.coins = def.coins.map((c) => ({ ...c, taken: false }));
  game.blockers = moveBlockers(def);
  game.sight = sightBlockers(def);
  game.alarm = 0;
  game.timeLeft = NIGHT_SECONDS;
  game.noisePing = null;
  game.smokeCloud = null;
  game.endReason = '';
  game.spottedFlash = 0;
  game.phase = PHASES.PLAY;
  showToast(game, `${def.name} — ${def.sub}`);
}

function showToast(game, text) {
  game.toast = text;
  game.toastUntil = game.now + 3.5;
}

export function startGame(game) {
  game.totalScore = 0;
  loadNight(game, 0);
}

// The getaway door opens once the required loot is in the bag.
export function exitOpen(game) {
  return game.thief.lootTaken.length >= game.level.requiredLoot;
}

function atExit(thief, level) {
  const e = level.exit;
  return thief.x + thief.radius > e.x - 4 && thief.y > e.y - 6 && thief.y < e.y + e.h + 6;
}

function bust(game, reason) {
  game.phase = PHASES.BUSTED;
  game.endReason = reason;
  sfx.playCaught();
}

export function updateGame(game, input, dt) {
  game.now += dt;

  // Title screen: no thief yet, so this branch must run before the guard below.
  if (game.phase === PHASES.TITLE) {
    if (input.pressed.has('Enter') || input.pressed.has('Space') || input.mouse.clicked) {
      startGame(game);
    }
    return;
  }

  const thief = game.thief;
  if (!thief) return;

  if (game.phase === PHASES.BUSTED || game.phase === PHASES.ESCAPED) {
    if (input.pressed.has('Enter') || input.pressed.has('Space') || input.mouse.clicked) {
      if (game.phase === PHASES.BUSTED) loadNight(game, game.nightIndex);
      else game.phase = PHASES.TITLE;
    }
    return;
  }

  if (game.phase === PHASES.NIGHT_DONE) {
    if (input.pressed.has('Enter') || input.pressed.has('Space') || input.mouse.clicked) {
      if (game.nightIndex + 1 < LEVELS.length) loadNight(game, game.nightIndex + 1);
      else game.phase = PHASES.ESCAPED;
    }
    return;
  }

  // --- playing ---
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    bust(game, 'The cleaner arrived at dawn — the crew had to scatter.');
    return;
  }

  game.mouse.x = input.mouse.x;
  game.mouse.y = input.mouse.y;

  // Smoke wears off.
  if (thief.smokeUntil && game.now >= thief.smokeUntil) {
    thief.hidden = false;
    thief.smokeUntil = 0;
    game.smokeCloud = null;
  }

  moveThief(thief, input, dt, game.blockers);

  // Tool keys 1/2/3 (Shift+key buys instead) and HUD clicks.
  for (const code of ['Digit1', 'Digit2', 'Digit3']) {
    if (input.pressed.has(code)) {
      const msg = keyToolBelt(thief, game, code.replace('Digit', ''), input.pressedShift.get(code) === true);
      if (msg) {
        showToast(game, msg);
        sfx.playTool();
      }
    }
  }
  if (input.mouse.clicked) {
    const msg = clickToolBelt(thief, game, input.mouse.clickX, input.mouse.clickY);
    if (msg) {
      showToast(game, msg);
      sfx.playBuy();
    }
  }

  // Coins on the floor.
  if (collectCoins(thief, game.coins) > 0) sfx.playCoin();

  // Grab big loot with E (or Space) when close enough.
  if (input.pressed.has('KeyE') || input.pressed.has('Space')) {
    const item = nearestLoot(thief, game.loot);
    if (item) {
      grabLoot(thief, item);
      showToast(game, `Lifted ${item.label} — $${item.value.toLocaleString()}`);
      sfx.playPickup();
    }
  }

  // Guards and cameras watch the thief; the alarm answers.
  let seenByGuard = 0;
  let seenByCamera = 0;
  let anyChase = false;
  for (const g of game.guards) {
    const seen = updateGuard(g, dt, thief, game.sight, game.now);
    seenByGuard = Math.max(seenByGuard, seen);
    if (g.state === 'chase') anyChase = true;
    if (guardCatches(g, thief)) {
      bust(game, `${g.name} grabbed your collar in the gallery.`);
      return;
    }
  }
  for (const cam of game.cameras) {
    seenByCamera = Math.max(seenByCamera, updateCamera(cam, dt, game.now, thief, game.sight));
  }

  const wasCalm = game.alarm < 40;
  if (seenByGuard > 0.3 || seenByCamera > 0.3) {
    game.alarm += (seenByGuard * ALARM.guardSpotRate + seenByCamera * ALARM.cameraSpotRate) * dt;
    if (anyChase) game.alarm += ALARM.chaseSpotRate * 0.25 * dt;
    if (wasCalm && game.alarm >= 40) {
      showToast(game, 'SPOTTED — break line of sight!');
      sfx.playSpotted();
      game.spottedFlash = 0.6;
    }
  } else {
    game.alarm = Math.max(0, game.alarm - ALARM.decayRate * dt);
  }
  game.alarm = Math.min(ALARM.lockdownAt, game.alarm);
  game.spottedFlash = Math.max(0, game.spottedFlash - dt);

  if (game.alarm >= ALARM.lockdownAt) {
    bust(game, 'LOCKDOWN — the alarm hit 100 and the vault sealed shut.');
    return;
  }

  // Alarm heartbeat while the heat is on.
  if (game.alarm > 55 && game.now - game.alarmTickAt > 0.8) {
    game.alarmTickAt = game.now;
    sfx.playAlarmTick();
  }

  // Win this night: required loot in the bag, then reach the getaway door.
  if (exitOpen(game) && atExit(thief, game.level)) {
    const nightScore = thief.lootValue + Math.round(game.timeLeft) * SCORE.nightBonusPerSecondLeft;
    game.totalScore += nightScore;
    game.endReason = `Clean getaway — $${thief.lootValue.toLocaleString()} of loot, ${Math.round(game.timeLeft)}s to spare.`;
    sfx.playWin();
    game.phase = PHASES.NIGHT_DONE;
  }
}

// Distance label for the HUD hint ("12m to the Duchess").
export function hintText(game) {
  if (game.phase !== PHASES.PLAY) return '';
  const item = nearestLoot(game.thief, game.loot);
  if (item) return `Press E to lift ${item.label} ($${item.value.toLocaleString()})`;
  if (!exitOpen(game)) {
    const left = game.level.requiredLoot - game.thief.lootTaken.length;
    return `Lift ${left} more masterpiece${left > 1 ? 's' : ''} to open the getaway door`;
  }
  return 'Getaway door open — reach the east door!';
}

export { VIEW_W, VIEW_H };
