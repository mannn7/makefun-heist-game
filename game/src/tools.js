// The Velvet Vault — the tool belt: buying and spending heist tools.
// One job: know where each tool button sits on the HUD and what a
// click or keypress on it does. The effects themselves live in player.js.

import { TOOLS } from './config.js';
import { spendTool, purchaseTool } from './player.js';

export const BELT_ORDER = ['emp', 'noise', 'smoke'];

// Tool buttons live in the HUD bar, right of the alarm meter.
export function beltButtonRect(kind, index) {
  return { x: 660 + index * 118, y: 10, w: 108, h: 44 };
}

export function buyBadgeRect(kind, index) {
  const b = beltButtonRect(kind, index);
  return { x: b.x + b.w - 34, y: b.y + 4, w: 30, h: 18 };
}

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// A mouse click on the HUD. Returns a message for the toast, or null.
export function clickBelt(thief, game, x, y) {
  for (let i = 0; i < BELT_ORDER.length; i++) {
    const kind = BELT_ORDER[i];
    if (inside(buyBadgeRect(kind, i), x, y)) {
      return purchaseTool(thief, kind);
    }
    if (inside(beltButtonRect(kind, i), x, y)) {
      return spendTool(thief, kind, game);
    }
  }
  return null;
}

// A number key (1/2/3) spends a tool; Shift+number buys one instead.
export function pressBelt(thief, game, key, shift) {
  for (const kind of BELT_ORDER) {
    if (TOOLS[kind].key === key) {
      return shift ? purchaseTool(thief, kind) : spendTool(thief, kind, game);
    }
  }
  return null;
}
