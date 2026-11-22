// The Velvet Vault — the seeing maths: cones, sight lines, occlusion.
// One question per function: "can this watcher see that spot?" Guards
// and cameras both ask it, so the answer has to be exactly the same
// for both. Everything here is pure: no state, no side effects.

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function bearingTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// The smallest gap between two headings, in radians, always 0..PI.
export function angleGap(a, b) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

// Is (px, py) inside the cone that starts at (ox, oy), looks along
// `facing`, opens `half` radians either side, and reaches `range`?
export function insideCone(ox, oy, facing, half, range, px, py) {
  const d = distance(ox, oy, px, py);
  if (d > range) return false;
  if (d < 4) return true;
  return angleGap(bearingTo(ox, oy, px, py), facing) <= half;
}

// Does the segment (x1,y1)-(x2,y2) touch rectangle r {x, y, w, h}?
export function segmentClipsRect(x1, y1, x2, y2, r) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
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

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = side(x3, y3, x4, y4, x1, y1);
  const d2 = side(x3, y3, x4, y4, x2, y2);
  const d3 = side(x1, y1, x2, y2, x3, y3);
  const d4 = side(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Which side of the line (ax,ay)-(bx,by) the point (px,py) sits on.
function side(ax, ay, bx, by, px, py) {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

// True when no blocker rectangle stands between watcher and target.
export function lineIsClear(ox, oy, tx, ty, blockers) {
  for (const b of blockers) {
    if (segmentClipsRect(ox, oy, tx, ty, b)) return false;
  }
  return true;
}

// How "seen" the thief is to one watcher: 0 (invisible) to 1 (dead
// centre of the cone, close up). Sneaking halves it; smoke or a
// hidden thief kills it outright.
export function spotStrength(watcher, tx, ty, blockers, sneaking, hidden) {
  if (hidden) return 0;
  const d = distance(watcher.x, watcher.y, tx, ty);
  if (d > watcher.range) return 0;
  if (!insideCone(watcher.x, watcher.y, watcher.facing, watcher.halfAngle, watcher.range, tx, ty)) return 0;
  if (!lineIsClear(watcher.x, watcher.y, tx, ty, blockers)) return 0;
  const centred = 1 - angleGap(bearingTo(watcher.x, watcher.y, tx, ty), watcher.facing) / watcher.halfAngle;
  const close = 1 - d / watcher.range;
  let strength = 0.35 + 0.65 * Math.max(centred, close);
  if (sneaking) strength *= 0.5;
  return strength;
}
