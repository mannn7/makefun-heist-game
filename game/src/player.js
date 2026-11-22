// The Velvet Vault — the thief: movement, sneaking, loot and tools.
// One job: turn keyboard and mouse input into a thief that moves,
// steals, and spends the crew's tools.

import { PLAYER, FLOOR, TOOLS, EMP_SECONDS, SMOKE_SECONDS, LURE_SECONDS } from './config.js';
import { distance } from './vision.js';
import { blackoutCameras } from './cameras.js';
import { baitGuard } from './guards.js';

export function spawnThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    radius: PLAYER.body,
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

// The closest point of a wall to (x, y), clamped into the wall's rect.
function closestOnWall(x, y, wall) {
  return {
    x: Math.max(wall.x, Math.min(x, wall.x + wall.w)),
    y: Math.max(wall.y, Math.min(y, wall.y + wall.h)),
  };
}

// Keep a circle inside the room and out of the walls.
export function collideCircle(x, y, r, blockers) {
  let nx = Math.max(FLOOR.x + r, Math.min(FLOOR.x + FLOOR.w - r, x));
  let ny = Math.max(FLOOR.y + r, Math.min(FLOOR.y + FLOOR.h - r, y));
  for (const wall of blockers) {
    const near = closestOnWall(nx, ny, wall);
    const dx = nx - near.x;
    const dy = ny - near.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        nx = near.x + (dx / d) * r;
        ny = near.y + (dy / d) * r;
      } else {
        nx = wall.x - r;
      }
    }
  }
  return { x: nx, y: ny };
}

export function walkThief(thief, input, dt, blockers) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  thief.sneaking = !!input.sneak;
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  const speed = thief.sneaking ? PLAYER.sneak : PLAYER.walk;
  const nx = thief.x + (dx / len) * speed * dt;
  const ny = thief.y + (dy / len) * speed * dt;
  thief.faceAngle = Math.atan2(dy, dx);
  const fixed = collideCircle(nx, ny, thief.radius, blockers);
  thief.x = fixed.x;
  thief.y = fixed.y;
}

// Walk over small coins; big loot needs a deliberate grab (E or click).
export function sweepCoins(thief, coins) {
  let gained = 0;
  for (const c of coins) {
    if (!c.taken && distance(thief.x, thief.y, c.x, c.y) < thief.radius + 16) {
      c.taken = true;
      gained += 25;
    }
  }
  thief.coins += gained;
  return gained;
}

export function closestLoot(thief, loot) {
  let best = null;
  let bestD = Infinity;
  for (const item of loot) {
    if (item.taken) continue;
    const d = distance(thief.x, thief.y, item.x, item.y);
    if (d < bestD) {
      bestD = d;
      best = item;
    }
  }
  return best && bestD <= PLAYER.reach + 26 ? best : null;
}

export function takeLoot(thief, item) {
  item.taken = true;
  thief.lootValue += item.value;
  thief.lootTaken.push(item);
  return item;
}

// Spend a tool. Returns a message for the HUD, or null when it cannot be used.
export function spendTool(thief, kind, game) {
  if (thief.tools[kind] <= 0) return null;
  thief.tools[kind] -= 1;
  if (kind === 'emp') {
    blackoutCameras(game.cameras, game.now, EMP_SECONDS);
    return 'EMP burst — cameras blind for 8s';
  }
  if (kind === 'noise') {
    // Throw the noisemaker toward the mouse (or ahead of the thief).
    const tx = game.mouse.x || thief.x + Math.cos(thief.faceAngle) * 160;
    const ty = game.mouse.y || thief.y + Math.sin(thief.faceAngle) * 160;
    let nearest = null;
    let bestD = Infinity;
    for (const g of game.guards) {
      const d = distance(g.x, g.y, tx, ty);
      if (d < bestD) {
        bestD = d;
        nearest = g;
      }
    }
    if (nearest) baitGuard(nearest, tx, ty, game.now, LURE_SECONDS);
    game.noisePing = { x: tx, y: ty, until: game.now + 1.2 };
    return 'Noisemaker thrown — a guard goes to check';
  }
  if (kind === 'smoke') {
    thief.smokeUntil = game.now + SMOKE_SECONDS;
    thief.hidden = true;
    game.smokeCloud = { x: thief.x, y: thief.y, until: game.now + SMOKE_SECONDS };
    return 'Smoke bomb — hidden for 6s';
  }
  return null;
}

export function purchaseTool(thief, kind) {
  const def = TOOLS[kind];
  if (thief.tools[kind] >= def.max) return 'Already carrying the max';
  if (thief.coins < def.price) return 'Not enough coins — grab small loot first';
  thief.coins -= def.price;
  thief.tools[kind] += 1;
  return `${def.name} bought`;
}
