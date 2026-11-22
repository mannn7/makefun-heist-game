// The Velvet Vault — staged shots: fixed, fair tableaus for screenshots.
// One job: given ?shot=<name>, put the game in a frozen mid-heist moment
// where the room, a guard cone, a camera cone, a loot target and the alarm
// meter are all visible in one frame. Nothing here is edited afterwards —
// these are real renders of the game's own code.

import { STAGES, openNight } from './game.js';

function poseGuard(game, name, x, y, facing, state, suspicion) {
  const guard = game.guards.find((gg) => gg.name === name);
  if (!guard) return;
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.state = state;
  guard.suspicion = suspicion;
  guard.pause = 999; // hold the pose while the shot is taken
}

function aimCamera(game, index, facing) {
  const cam = game.cameras[index];
  if (!cam) return;
  cam.facing = facing;
  cam.phase = 0;
  cam.speed = 0; // hold the sweep still for the shot
}

function holdFrame(game) {
  game.shotFrozen = true;
  game.now = 2.0; // a fixed clock so glows and pulses are stable
}

// The cover: mid-heist on the carpet, a cone sweeping toward the thief.
export function tableauCover(game) {
  openNight(game, 0);
  game.thief.x = 700;
  game.thief.y = 400;
  game.thief.sneaking = true;
  game.thief.faceAngle = Math.PI;
  game.alarm = 35;
  poseGuard(game, 'Marco', 560, 330, 0.35, 'suspicious', 0.6);
  poseGuard(game, 'Inez', 980, 200, Math.PI * 0.75, 'patrol', 0.1);
  aimCamera(game, 0, Math.PI / 2 + 0.5);
  aimCamera(game, 1, -Math.PI / 2 - 0.4);
  holdFrame(game);
}

// Smoke bomb in the middle of the gallery, alarm climbing.
export function tableauSmoke(game) {
  openNight(game, 0);
  game.thief.x = 660;
  game.thief.y = 430;
  game.thief.faceAngle = -Math.PI / 2;
  game.thief.hidden = true;
  game.thief.smokeUntil = 999;
  game.smokeCloud = { x: 660, y: 430, until: 999 };
  game.thief.tools.smoke = 1;
  game.alarm = 55;
  poseGuard(game, 'Marco', 480, 330, 0, 'suspicious', 0.75);
  poseGuard(game, 'Inez', 980, 420, Math.PI, 'patrol', 0.2);
  aimCamera(game, 0, Math.PI / 2 - 0.3);
  aimCamera(game, 1, -Math.PI / 2 + 0.5);
  holdFrame(game);
}

// The alarm is nearly maxed and a guard is sprinting in — the fair caught moment.
export function tableauAlarm(game) {
  openNight(game, 1);
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
  poseGuard(game, 'Otto', 900, 330, 0, 'chase', 1);
  poseGuard(game, 'Inez', 1180, 200, Math.PI / 2, 'suspicious', 0.8);
  poseGuard(game, 'Marco', 400, 560, -Math.PI / 2, 'patrol', 0.15);
  aimCamera(game, 0, Math.PI / 2 + 0.6);
  aimCamera(game, 1, Math.PI / 2 - 0.6);
  aimCamera(game, 2, -Math.PI / 2);
  holdFrame(game);
}

// The getaway: loot in the bag, door open, thief slipping out.
export function tableauGetaway(game) {
  openNight(game, 0);
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
  poseGuard(game, 'Marco', 420, 560, Math.PI, 'patrol', 0.05);
  poseGuard(game, 'Inez', 980, 180, Math.PI / 2, 'patrol', 0.1);
  aimCamera(game, 0, Math.PI / 2 - 0.7);
  aimCamera(game, 1, -Math.PI / 2 + 0.7);
  holdFrame(game);
}

export function stageTableau(game, name) {
  if (name === 'cover') { tableauCover(game); return true; }
  if (name === 'smoke') { tableauSmoke(game); return true; }
  if (name === 'alarm') { tableauAlarm(game); return true; }
  if (name === 'getaway') { tableauGetaway(game); return true; }
  return false;
}
