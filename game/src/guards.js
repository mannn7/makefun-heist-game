// The Velvet Vault — guards: patrols, suspicion and the chase.
// One job: move each guard along its route and decide how suspicious it is.

import { angleTo, dist, seenStrength } from './vision.js';
import { PLAYER } from './config.js';

export function makeGuard(def) {
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
function stepPatrol(g, dt) {
  const target = g.waypoints[g.leg];
  const d = dist(g.x, g.y, target.x, target.y);
  const step = g.speed * dt;
  if (d <= Math.max(step, 2)) {
    g.x = target.x;
    g.y = target.y;
    g.leg = (g.leg + 1) % g.waypoints.length;
    g.pause = 0.9; // glance around at each corner — the fair moment to slip past
    return;
  }
  g.facing = angleTo(g.x, g.y, target.x, target.y);
  g.x += ((target.x - g.x) / d) * step;
  g.y += ((target.y - g.y) / d) * step;
}

export function updateGuard(g, dt, thief, blockers, now) {
  // A lured guard walks to the noise and looks around for a while.
  if (g.lure) {
    if (now < g.lure.until) {
      const d = dist(g.x, g.y, g.lure.x, g.lure.y);
      const step = g.speed * 1.15 * dt;
      if (d > step) {
        g.facing = angleTo(g.x, g.y, g.lure.x, g.lure.y);
        g.x += ((g.lure.x - g.x) / d) * step;
        g.y += ((g.lure.y - g.y) / d) * step;
      } else {
        g.facing += dt * 1.6; // scanning the spot where the noise came from
      }
      g.suspicion = Math.max(0, g.suspicion - dt * 0.4);
      return g.suspicion;
    }
    g.lure = null;
  }

  if (g.pause > 0) {
    g.pause -= dt;
    g.facing += dt * 0.9; // slow look left and right at the corner
  } else if (g.state === 'chase') {
    // Sprint at the thief's last known spot.
    const d = dist(g.x, g.y, thief.x, thief.y);
    const step = g.speed * 1.85 * dt;
    if (d > step) {
      g.facing = angleTo(g.x, g.y, thief.x, thief.y);
      g.x += ((thief.x - g.x) / d) * step;
      g.y += ((thief.y - g.y) / d) * step;
    }
  } else {
    stepPatrol(g, dt);
  }

  // Vision: how strongly does this guard see the thief right now?
  const watcher = { x: g.x, y: g.y, facing: g.facing, halfAngle: g.halfAngle, range: g.range };
  let seen = seenStrength(watcher, thief.x, thief.y, blockers, thief.sneaking, thief.hidden);
  // Bumping into a guard at arm's length is always noticed.
  if (dist(g.x, g.y, thief.x, thief.y) < PLAYER.seenRadius * 0.55) seen = Math.max(seen, 0.9);

  if (seen > 0.25) {
    g.suspicion = Math.min(1, g.suspicion + seen * dt * 1.4);
  } else {
    g.suspicion = Math.max(0, g.suspicion - dt * 0.35);
  }

  if (g.suspicion >= 1) g.state = 'chase';
  else if (g.suspicion > 0.45) g.state = 'suspicious';
  else if (g.state !== 'chase') g.state = 'patrol';
  if (g.state === 'chase' && seen <= 0.05) {
    // Lost the thief: give up after the suspicion drains.
    g.suspicion = Math.max(0, g.suspicion - dt * 0.25);
    if (g.suspicion < 0.4) g.state = 'patrol';
  }
  return seen;
}

// Does this guard physically catch the thief?
export function guardCatches(g, thief) {
  return dist(g.x, g.y, thief.x, thief.y) < PLAYER.radius + 15;
}

export function lureGuard(g, x, y, now, seconds) {
  g.lure = { x, y, until: now + seconds };
  g.state = 'patrol';
  g.suspicion = Math.min(g.suspicion, 0.3);
}
