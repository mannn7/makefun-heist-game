// The Velvet Vault — bootstrap: canvas, loop, and the ?shot= staging hook.
// One job: wire input, game state and rendering together and run the loop.

import { STAGE_W, STAGE_H } from './config.js';
import { freshGame, tickGame, STAGES } from './game.js';
import { paintGame } from './render.js';
import { freshInput, wireInput, clearFrameInput } from './input.js';
import { stageTableau } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = STAGE_W;
canvas.height = STAGE_H;
const pen = canvas.getContext('2d');

const game = freshGame();
const input = freshInput();
wireInput(input, canvas);

// Read-only handle for local play-testing (headless Chrome drives the game
// through this and checks the thief, the alarm and the endings move).
window.__velvet = game;

// A staged shot (?shot=cover|smoke|alarm|getaway) freezes the game in a
// fixed mid-heist moment so screenshots are stable renders of real play.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  if (!stageTableau(game, shot)) {
    document.title = `Unknown shot: ${shot}`;
  }
} else {
  game.phase = STAGES.TITLE;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.shotFrozen) tickGame(game, input, dt);
  paintGame(pen, game);
  clearFrameInput(input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
