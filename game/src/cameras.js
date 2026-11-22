// The Velvet Vault — security cameras: the sweeping eye on the wall.
// One job: swing each camera's cone and say how strongly it sees the thief.

import { seenStrength } from './vision.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    halfAngle: def.halfAngle,
    phase: Math.random() * Math.PI * 2,
    facing: def.baseAngle,
    disabledUntil: 0,
    spotting: 0, // 0..1 — how hard the camera is staring at the thief
  };
}

export function updateCamera(cam, dt, now, thief, blockers) {
  // Sweep back and forth like a pendulum around the base angle.
  cam.phase += dt * cam.speed * 2;
  cam.facing = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;

  if (now < cam.disabledUntil) {
    cam.spotting = 0;
    return 0;
  }
  const watcher = { x: cam.x, y: cam.y, facing: cam.facing, halfAngle: cam.halfAngle, range: cam.range };
  const seen = seenStrength(watcher, thief.x, thief.y, blockers, thief.sneaking, thief.hidden);
  cam.spotting = seen;
  return seen;
}

export function disableAllCameras(cameras, now, seconds) {
  for (const cam of cameras) cam.disabledUntil = now + seconds;
}
