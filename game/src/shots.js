// The Velvet Vault — staged shots: fixed, fair tableaus for screenshots.
// One job: given ?shot=<name>, put the game in a frozen mid-heist moment
// where the room, a guard cone, a camera cone, a loot target and the alarm
// meter are all visible in one frame. Nothing here is edited afterwards —
// these are real renders of the game's own code.

import { PHASES, loadNight } from './game.js';

function placeGuard(game, name, x, y, facing, state, suspicion) {
  const g = game.guards.find((gg) => gg.name === name);
  if (!g) return;
  g.x = x;
  g.y = y;
  g.facing = facing;
  g.state = state;
  g.suspicion = suspicion;
  g.pause = 999; // hold the pose while the shot is taken
}

function pointCamera(game, index, facing) {
  const cam = game.cameras[index];
  if (!cam) return;
  cam.facing = facing;
  cam.phase = 0;
  cam.speed = 0; // hold the sweep still for the shot
}

function freeze(game) {
  game.shotFrozen = true;
  game.now = 2.0; // a fixed clock so glows and pulses are stable
}

// The cover: mid-heist on the carpet, a cone sweeping toward the thief.
export function stageCover(game) {
  loadNight(game, 0);
  game.thief.x = 700;
  game.thief.y = 400;
  game.thief.sneaking = true;
  game.thief.faceAngle = Math.PI;
  game.alarm = 35;
  placeGuard(game, 'Marco', 560, 330, 0.35, 'suspicious', 0.6);
  placeGuard(game, 'Inez', 980, 200, Math.PI * 0.75, 'patrol', 0.1);
  pointCamera(game, 0, Math.PI / 2 + 0.5);
  pointCamera(game, 1, -Math.PI / 2 - 0.4);
  freeze(game);
}

// Smoke bomb in the middle of the gallery, alarm climbing.
export function stageSmoke(game) {
  loadNight(game, 0);
  game.thief.x = 660;
  game.thief.y = 430;
  game.thief.faceAngle = -Math.PI / 2;
  game.thief.hidden = true;
  game.thief.smokeUntil = 999;
  game.smokeCloud = { x: 660, y: 430, until: 999 };
  game.thief.tools.smoke = 1;
  game.alarm = 55;
  placeGuard(game, 'Marco', 480, 330, 0, 'suspicious', 0.75);
  placeGuard(game, 'Inez', 980, 420, Math.PI, 'patrol', 0.2);
  pointCamera(game, 0, Math.PI / 2 - 0.3);
  pointCamera(game, 1, -Math.PI / 2 + 0.5);
  freeze(game);
}

// The alarm is nearly maxed and a guard is sprinting in — the fair caught moment.
export function stageAlarm(game) {
  loadNight(game, 1);
  game.thief.x = 1150;
  game.thief.y = 330;
  game.thief.faceAngle = Math.PI;
  game.thief.sneaking = false;
  const crown = game.loot.find((l) => l.id === 'crown');
  const duchess = game.loot.find((l) => l.id === 'duchess');
  if (crown) crown.taken = true;
  if (duchess) duchess.taken = true;
  game.thief.lootTaken = [crown, duchess].filter(Boolean);
  game.thief.lootValue = game.thief.lootTaken.reduce((s, l) => s + l.value, 0);
  game.alarm = 82;
  game.spottedFlash = 0.3;
  placeGuard(game, 'Otto', 900, 330, 0, 'chase', 1);
  placeGuard(game, 'Inez', 1180, 200, Math.PI / 2, 'suspicious', 0.8);
  placeGuard(game, 'Marco', 400, 560, -Math.PI / 2, 'patrol', 0.15);
  pointCamera(game, 0, Math.PI / 2 + 0.6);
  pointCamera(game, 1, Math.PI / 2 - 0.6);
  pointCamera(game, 2, -Math.PI / 2);
  freeze(game);
}

// The getaway: loot in the bag, door open, thief slipping out.
export function stageGetaway(game) {
  loadNight(game, 0);
  game.thief.x = 1215;
  game.thief.y = 365;
  game.thief.faceAngle = 0;
  const duchess = game.loot.find((l) => l.id === 'duchess');
  const sapphire = game.loot.find((l) => l.id === 'sapphire');
  if (duchess) duchess.taken = true;
  if (sapphire) sapphire.taken = true;
  game.thief.lootTaken = [duchess, sapphire].filter(Boolean);
  game.thief.lootValue = game.thief.lootTaken.reduce((s, l) => s + l.value, 0);
  game.alarm = 18;
  placeGuard(game, 'Marco', 420, 560, Math.PI, 'patrol', 0.05);
  placeGuard(game, 'Inez', 980, 180, Math.PI / 2, 'patrol', 0.1);
  pointCamera(game, 0, Math.PI / 2 - 0.7);
  pointCamera(game, 1, -Math.PI / 2 + 0.7);
  freeze(game);
}

export function stageShot(game, name) {
  if (name === 'cover') { stageCover(game); return true; }
  if (name === 'smoke') { stageSmoke(game); return true; }
  if (name === 'alarm') { stageAlarm(game); return true; }
  if (name === 'getaway') { stageGetaway(game); return true; }
  return false;
}
