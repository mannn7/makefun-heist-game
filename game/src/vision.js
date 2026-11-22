// The Velvet Vault — vision math: cones, line of sight and occlusion.
// One job: answer "can this watcher see that point?" for guards and cameras.

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Smallest absolute difference between two angles, in radians.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Is point (px,py) inside the cone from (ox,oy) facing `facing`, half-angle `half`, range `range`?
export function pointInCone(ox, oy, facing, half, range, px, py) {
  const d = dist(ox, oy, px, py);
  if (d > range) return false;
  if (d < 4) return true;
  return angleDiff(angleTo(ox, oy, px, py), facing) <= half;
}

// Segment (x1,y1)-(x2,y2) against rectangle r {x,y,w,h}: true when they touch.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) return true;
  }
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = side(x3, y3, x4, y4, x1, y1);
  const d2 = side(x3, y3, x4, y4, x2, y2);
  const d3 = side(x1, y1, x2, y2, x3, y3);
  const d4 = side(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function side(ax, ay, bx, by, px, py) {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

// True when no blocker rectangle stands between watcher and target.
export function hasLineOfSight(ox, oy, tx, ty, blockers) {
  for (const b of blockers) {
    if (segmentHitsRect(ox, oy, tx, ty, b)) return false;
  }
  return true;
}

// How "seen" the thief is by one watcher: 0 (hidden) to 1 (dead centre of the cone).
// Sneaking halves the strength; smoke or darkness kills it outright.
export function seenStrength(watcher, tx, ty, blockers, sneaking, hidden) {
  if (hidden) return 0;
  const d = dist(watcher.x, watcher.y, tx, ty);
  if (d > watcher.range) return 0;
  if (!pointInCone(watcher.x, watcher.y, watcher.facing, watcher.halfAngle, watcher.range, tx, ty)) return 0;
  if (!hasLineOfSight(watcher.x, watcher.y, tx, ty, blockers)) return 0;
  const centre = 1 - angleDiff(angleTo(watcher.x, watcher.y, tx, ty), watcher.facing) / watcher.halfAngle;
  const near = 1 - d / watcher.range;
  let strength = 0.35 + 0.65 * Math.max(centre, near);
  if (sneaking) strength *= 0.5;
  return strength;
}
