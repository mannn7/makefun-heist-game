// The Velvet Vault — game state: nights, the alarm, winning and losing.
// One job: own the whole match — one tickGame() per frame, one stage
// at a time. Everything below runs in a fixed order each frame:
// the clock, the thief, the tools, the loot, the watchers, the
// alarm, and finally the win check at the getaway door.

import { ALARM, NIGHT_LENGTH, SCORE, STAGE_W, STAGE_H } from './config.js';
import { LEVELS, occluders, solids } from './levels.js';
import { spawnGuard, tickGuard, guardGrabs } from './guards.js';
import { spawnCamera, tickCamera } from './cameras.js';
import { spawnThief, walkThief, sweepCoins, closestLoot, takeLoot } from './player.js';
import { pressBelt, clickBelt } from './tools.js';
import { distance } from './vision.js';
import * as sfx from './audio.js';

export const STAGES = {
  TITLE: 'title',
  PLAY: 'play',
  BUSTED: 'busted',
  ESCAPED: 'escaped',
  NIGHT_DONE: 'night-done',
};

export function freshGame() {
  return {
    phase: STAGES.TITLE,
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
    timeLeft: NIGHT_LENGTH,
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

export function openNight(game, index) {
  const def = LEVELS[index];
  game.nightIndex = index;
  game.level = def;
  game.guards = def.guards.map(spawnGuard);
  game.cameras = def.cameras.map(spawnCamera);
  game.thief = spawnThief(def.spawn);
  game.loot = def.loot.map((l) => ({ ...l, taken: false }));
  game.coins = def.coins.map((c) => ({ ...c, taken: false }));
  game.blockers = solids(def);
  game.sight = occluders(def);
  game.alarm = 0;
  game.timeLeft = NIGHT_LENGTH;
  game.noisePing = null;
  game.smokeCloud = null;
  game.endReason = '';
  game.spottedFlash = 0;
  game.phase = STAGES.PLAY;
  setToast(game, `${def.name} — ${def.sub}`);
}

function setToast(game, text) {
  game.toast = text;
  game.toastUntil = game.now + 3.5;
}

export function beginHeist(game) {
  game.totalScore = 0;
  openNight(game, 0);
}

// The getaway door opens once the required loot is in the bag.
export function doorOpen(game) {
  return game.thief.lootTaken.length >= game.level.requiredLoot;
}

function nearExit(thief, level) {
  const e = level.exit;
  return thief.x + thief.radius > e.x - 4 && thief.y > e.y - 6 && thief.y < e.y + e.h + 6;
}

function endBusted(game, reason) {
  game.phase = STAGES.BUSTED;
  game.endReason = reason;
  sfx.stingCaught();
}

// Fold one frame of watcher pressure into the alarm meter: it climbs
// while anyone sees the thief and cools off while nobody does.
function updateAlarm(game, seenByGuard, seenByCamera, anyChase, dt) {
  const wasCalm = game.alarm < 40;
  if (seenByGuard > 0.3 || seenByCamera > 0.3) {
    game.alarm += (seenByGuard * ALARM.fromGuard + seenByCamera * ALARM.fromCamera) * dt;
    if (anyChase) game.alarm += ALARM.fromChase * 0.25 * dt;
    if (wasCalm && game.alarm >= 40) {
      setToast(game, 'SPOTTED — break line of sight!');
      sfx.stingSpotted();
      game.spottedFlash = 0.6;
    }
  } else {
    game.alarm = Math.max(0, game.alarm - ALARM.coolDown * dt);
  }
  game.alarm = Math.min(ALARM.lockdown, game.alarm);
  game.spottedFlash = Math.max(0, game.spottedFlash - dt);
}

export function tickGame(game, input, dt) {
  game.now += dt;

  // Title screen: no thief yet, so this branch must run before the guard below.
  if (game.phase === STAGES.TITLE) {
    if (input.pressed.has('Enter') || input.pressed.has('Space') || input.mouse.clicked) {
      beginHeist(game);
    }
    return;
  }

  const thief = game.thief;
  if (!thief) return;

  if (game.phase === STAGES.BUSTED || game.phase === STAGES.ESCAPED) {
    if (input.pressed.has('Enter') || input.pressed.has('Space') || input.mouse.clicked) {
      if (game.phase === STAGES.BUSTED) openNight(game, game.nightIndex);
      else game.phase = STAGES.TITLE;
    }
    return;
  }

  if (game.phase === STAGES.NIGHT_DONE) {
    if (input.pressed.has('Enter') || input.pressed.has('Space') || input.mouse.clicked) {
      if (game.nightIndex + 1 < LEVELS.length) openNight(game, game.nightIndex + 1);
      else game.phase = STAGES.ESCAPED;
    }
    return;
  }

  // --- playing ---
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    endBusted(game, 'The cleaner arrived at dawn — the crew had to scatter.');
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

  walkThief(thief, input, dt, game.blockers);

  // Tool keys 1/2/3 (Shift+key buys instead) and HUD clicks.
  for (const code of ['Digit1', 'Digit2', 'Digit3']) {
    if (input.pressed.has(code)) {
      const msg = pressBelt(thief, game, code.replace('Digit', ''), input.pressedShift.get(code) === true);
      if (msg) {
        setToast(game, msg);
        sfx.blipTool();
      }
    }
  }
  if (input.mouse.clicked) {
    const msg = clickBelt(thief, game, input.mouse.clickX, input.mouse.clickY);
    if (msg) {
      setToast(game, msg);
      sfx.chimeBuy();
    }
  }

  // Coins on the floor.
  if (sweepCoins(thief, game.coins) > 0) sfx.chimeCoin();

  // Grab big loot with E (or Space) when close enough.
  if (input.pressed.has('KeyE') || input.pressed.has('Space')) {
    const item = closestLoot(thief, game.loot);
    if (item) {
      takeLoot(thief, item);
      setToast(game, `Lifted ${item.label} — $${item.value.toLocaleString()}`);
      sfx.chimePickup();
    }
  }

  // Guards and cameras watch the thief; the alarm answers.
  let seenByGuard = 0;
  let seenByCamera = 0;
  let anyChase = false;
  for (const g of game.guards) {
    const seen = tickGuard(g, dt, thief, game.sight, game.now);
    seenByGuard = Math.max(seenByGuard, seen);
    if (g.state === 'chase') anyChase = true;
    if (guardGrabs(g, thief)) {
      endBusted(game, `${g.name} grabbed your collar in the gallery.`);
      return;
    }
  }
  for (const cam of game.cameras) {
    seenByCamera = Math.max(seenByCamera, tickCamera(cam, dt, game.now, thief, game.sight));
  }

  updateAlarm(game, seenByGuard, seenByCamera, anyChase, dt);

  if (game.alarm >= ALARM.lockdown) {
    endBusted(game, 'LOCKDOWN — the alarm hit 100 and the vault sealed shut.');
    return;
  }

  // Alarm heartbeat while the heat is on.
  if (game.alarm > 55 && game.now - game.alarmTickAt > 0.8) {
    game.alarmTickAt = game.now;
    sfx.tickAlarm();
  }

  // Win this night: required loot in the bag, then reach the getaway door.
  if (doorOpen(game) && nearExit(thief, game.level)) {
    const nightScore = thief.lootValue + Math.round(game.timeLeft) * SCORE.timeBonus;
    game.totalScore += nightScore;
    game.endReason = `Clean getaway — $${thief.lootValue.toLocaleString()} of loot, ${Math.round(game.timeLeft)}s to spare.`;
    sfx.fanfareWin();
    game.phase = STAGES.NIGHT_DONE;
  }
}

// Distance label for the HUD hint ("12m to the Duchess").
export function hintLine(game) {
  if (game.phase !== STAGES.PLAY) return '';
  const item = closestLoot(game.thief, game.loot);
  if (item) return `Press E to lift ${item.label} ($${item.value.toLocaleString()})`;
  if (!doorOpen(game)) {
    const left = game.level.requiredLoot - game.thief.lootTaken.length;
    return `Lift ${left} more masterpiece${left > 1 ? 's' : ''} to open the getaway door`;
  }
  return 'Getaway door open — reach the east door!';
}

export { STAGE_W, STAGE_H };
