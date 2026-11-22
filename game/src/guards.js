// The Velvet Vault — guards: patrols, suspicion and the chase.
// One job: walk each guard along its route and decide how suspicious
// it is. A guard has three moods: patrol, suspicious, chase.

import { bearingTo, distance, spotStrength } from './vision.js';
import { PLAYER } from './config.js';

export function spawnGuard(def) {
  const start = def.waypoints[0];
  return {
    name: def.name,
    waypoints: def.waypoints,
    speed: def.speed,
    range: def.range,
    halfAngle: def.halfAngle,
    x: start.x,
    y: start.y,
    facing: 0,
    leg: 1, // index of the waypoint being walked toward
    suspicion: 0, // 0..1 — fills while the thief is in the cone
    state: 'patrol', // patrol | suspicious | chase
    lure: null, // {x, y, until} when a noisemaker pulls the guard away
    pause: 0,
  };
}

// Walk toward the current waypoint; turn to face the direction of travel.
function stepPatrol(guard, dt) {
  const target = guard.waypoints[guard.leg];
  const d = distance(guard.x, guard.y, target.x, target.y);
  const step = guard.speed * dt;
  if (d <= Math.max(step, 2)) {
    guard.x = target.x;
    guard.y = target.y;
    guard.leg = (guard.leg + 1) % guard.waypoints.length;
    guard.pause = 0.9; // glance around at each corner — the fair moment to slip past
    return;
  }
  guard.facing = bearingTo(guard.x, guard.y, target.x, target.y);
  guard.x += ((target.x - guard.x) / d) * step;
  guard.y += ((target.y - guard.y) / d) * step;
}

// Walk toward the lure point, scanning once arrived.
function stepLure(guard, dt, now) {
  const d = distance(guard.x, guard.y, guard.lure.x, guard.lure.y);
  const step = guard.speed * 1.15 * dt;
  if (d > step) {
    guard.facing = bearingTo(guard.x, guard.y, guard.lure.x, guard.lure.y);
    guard.x += ((guard.lure.x - guard.x) / d) * step;
    guard.y += ((guard.lure.y - guard.y) / d) * step;
  } else {
    guard.facing += dt * 1.6; // scanning the spot where the noise came from
  }
  guard.suspicion = Math.max(0, guard.suspicion - dt * 0.4);
}

// Sprint at the thief's last known spot.
function stepChase(guard, dt, thief) {
  const d = distance(guard.x, guard.y, thief.x, thief.y);
  const step = guard.speed * 1.85 * dt;
  if (d > step) {
    guard.facing = bearingTo(guard.x, guard.y, thief.x, thief.y);
    guard.x += ((thief.x - guard.x) / d) * step;
    guard.y += ((thief.y - guard.y) / d) * step;
  }
}

export function tickGuard(guard, dt, thief, blockers, now) {
  // A lured guard walks to the noise and looks around for a while.
  if (guard.lure) {
    if (now < guard.lure.until) {
      stepLure(guard, dt, now);
      return guard.suspicion;
    }
    guard.lure = null;
  }

  if (guard.pause > 0) {
    guard.pause -= dt;
    guard.facing += dt * 0.9; // slow look left and right at the corner
  } else if (guard.state === 'chase') {
    stepChase(guard, dt, thief);
  } else {
    stepPatrol(guard, dt);
  }

  // Vision: how strongly does this guard see the thief right now?
  const watcher = { x: guard.x, y: guard.y, facing: guard.facing, halfAngle: guard.halfAngle, range: guard.range };
  let seen = spotStrength(watcher, thief.x, thief.y, blockers, thief.sneaking, thief.hidden);
  // Bumping into a guard at arm's length is always noticed.
  if (distance(guard.x, guard.y, thief.x, thief.y) < PLAYER.notice * 0.55) seen = Math.max(seen, 0.9);

  if (seen > 0.25) {
    guard.suspicion = Math.min(1, guard.suspicion + seen * dt * 1.4);
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.35);
  }

  if (guard.suspicion >= 1) guard.state = 'chase';
  else if (guard.suspicion > 0.45) guard.state = 'suspicious';
  else if (guard.state !== 'chase') guard.state = 'patrol';
  if (guard.state === 'chase' && seen <= 0.05) {
    // Lost the thief: give up after the suspicion drains.
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.25);
    if (guard.suspicion < 0.4) guard.state = 'patrol';
  }
  return seen;
}

// Does this guard physically catch the thief?
export function guardGrabs(guard, thief) {
  return distance(guard.x, guard.y, thief.x, thief.y) < PLAYER.body + 15;
}

export function baitGuard(guard, x, y, now, seconds) {
  guard.lure = { x, y, until: now + seconds };
  guard.state = 'patrol';
  guard.suspicion = Math.min(guard.suspicion, 0.3);
}
