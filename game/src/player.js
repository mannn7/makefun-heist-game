// The Velvet Vault — the thief: movement, sneaking, loot and tools.
// One job: turn keyboard and mouse input into a thief that moves and steals.

import { PLAYER, ROOM, TOOLS, EMP_DURATION, SMOKE_DURATION, NOISE_LURE_SECONDS } from './config.js';
import { dist } from './vision.js';
import { disableAllCameras } from './cameras.js';
import { lureGuard } from './guards.js';

export function makeThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    radius: PLAYER.radius,
    sneaking: false,
    hidden: false, // inside a smoke cloud
    coins: 100, // starting crew cash
    tools: { emp: 1, noise: 2, smoke: 1 },
    lootValue: 0,
    lootTaken: [],
    smokeUntil: 0,
    faceAngle: -Math.PI / 2,
  };
}

// Keep a circle inside the room and out of the walls.
export function collideCircle(x, y, r, blockers) {
  let nx = Math.max(ROOM.x + r, Math.min(ROOM.x + ROOM.w - r, x));
  let ny = Math.max(ROOM.y + r, Math.min(ROOM.y + ROOM.h - r, y));
  for (const b of blockers) {
    const cx = Math.max(b.x, Math.min(nx, b.x + b.w));
    const cy = Math.max(b.y, Math.min(ny, b.y + b.h));
    const dx = nx - cx;
    const dy = ny - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        nx = cx + (dx / d) * r;
        ny = cy + (dy / d) * r;
      } else {
        nx = b.x - r;
      }
    }
  }
  return { x: nx, y: ny };
}

export function moveThief(thief, input, dt, blockers) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  thief.sneaking = !!input.sneak;
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  const speed = thief.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const nx = thief.x + (dx / len) * speed * dt;
  const ny = thief.y + (dy / len) * speed * dt;
  thief.faceAngle = Math.atan2(dy, dx);
  const fixed = collideCircle(nx, ny, thief.radius, blockers);
  thief.x = fixed.x;
  thief.y = fixed.y;
}

// Walk over small coins; big loot needs a deliberate grab (E or click).
export function collectCoins(thief, coins) {
  let gained = 0;
  for (const c of coins) {
    if (!c.taken && dist(thief.x, thief.y, c.x, c.y) < thief.radius + 16) {
      c.taken = true;
      gained += 25;
    }
  }
  thief.coins += gained;
  return gained;
}

export function nearestLoot(thief, loot) {
  let best = null;
  let bestD = Infinity;
  for (const item of loot) {
    if (item.taken) continue;
    const d = dist(thief.x, thief.y, item.x, item.y);
    if (d < bestD) {
      bestD = d;
      best = item;
    }
  }
  return best && bestD <= PLAYER.grabRadius + 26 ? best : null;
}

export function grabLoot(thief, item) {
  item.taken = true;
  thief.lootValue += item.value;
  thief.lootTaken.push(item);
  return item;
}

// Spend a tool. Returns a message for the HUD, or null when it cannot be used.
export function useTool(thief, kind, game) {
  if (thief.tools[kind] <= 0) return null;
  thief.tools[kind] -= 1;
  if (kind === 'emp') {
    disableAllCameras(game.cameras, game.now, EMP_DURATION);
    return 'EMP burst — cameras blind for 8s';
  }
  if (kind === 'noise') {
    // Throw the noisemaker toward the mouse (or ahead of the thief).
    const tx = game.mouse.x || thief.x + Math.cos(thief.faceAngle) * 160;
    const ty = game.mouse.y || thief.y + Math.sin(thief.faceAngle) * 160;
    let nearest = null;
    let bestD = Infinity;
    for (const g of game.guards) {
      const d = dist(g.x, g.y, tx, ty);
      if (d < bestD) {
        bestD = d;
        nearest = g;
      }
    }
    if (nearest) lureGuard(nearest, tx, ty, game.now, NOISE_LURE_SECONDS);
    game.noisePing = { x: tx, y: ty, until: game.now + 1.2 };
    return 'Noisemaker thrown — a guard goes to check';
  }
  if (kind === 'smoke') {
    thief.smokeUntil = game.now + SMOKE_DURATION;
    thief.hidden = true;
    game.smokeCloud = { x: thief.x, y: thief.y, until: game.now + SMOKE_DURATION };
    return 'Smoke bomb — hidden for 6s';
  }
  return null;
}

export function buyTool(thief, kind) {
  const def = TOOLS[kind];
  if (thief.tools[kind] >= def.max) return 'Already carrying the max';
  if (thief.coins < def.price) return 'Not enough coins — grab small loot first';
  thief.coins -= def.price;
  thief.tools[kind] += 1;
  return `${def.name} bought`;
}
