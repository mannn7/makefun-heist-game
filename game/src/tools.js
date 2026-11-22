// The Velvet Vault — the tool belt: buying and spending heist tools.
// One job: know where each tool button sits on the HUD and what a click or
// keypress on it does. The effects themselves live in player.js.

import { TOOLS } from './config.js';
import { useTool, buyTool } from './player.js';

export const TOOL_ORDER = ['emp', 'noise', 'smoke'];

// Tool buttons live in the HUD bar, right of the alarm meter.
export function toolButtonRect(kind, index) {
  return { x: 660 + index * 118, y: 10, w: 108, h: 44 };
}

export function buyButtonRect(kind, index) {
  const b = toolButtonRect(kind, index);
  return { x: b.x + b.w - 34, y: b.y + 4, w: 30, h: 18 };
}

function hit(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// A mouse click on the HUD. Returns a message for the toast, or null.
export function clickToolBelt(thief, game, x, y) {
  for (let i = 0; i < TOOL_ORDER.length; i++) {
    const kind = TOOL_ORDER[i];
    if (hit(buyButtonRect(kind, i), x, y)) {
      return buyTool(thief, kind);
    }
    if (hit(toolButtonRect(kind, i), x, y)) {
      return useTool(thief, kind, game);
    }
  }
  return null;
}

// A number key (1/2/3) spends a tool; Shift+number buys one instead.
export function keyToolBelt(thief, game, key, shift) {
  for (const kind of TOOL_ORDER) {
    if (TOOLS[kind].key === key) {
      return shift ? buyTool(thief, kind) : useTool(thief, kind, game);
    }
  }
  return null;
}
