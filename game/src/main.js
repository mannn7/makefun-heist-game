// The Velvet Vault — bootstrap: canvas, loop, and the ?shot= staging hook.
// One job: wire input, game state and rendering together and run the loop.

import { VIEW_W, VIEW_H } from './config.js';
import { makeGame, updateGame, PHASES } from './game.js';
import { renderGame } from './render.js';
import { makeInput, attachInput, endFrameInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const game = makeGame();
const input = makeInput();
attachInput(input, canvas);

// Read-only handle for local play-testing (headless Chrome drives the game
// through this and checks the thief, the alarm and the endings move).
window.__velvet = game;

// A staged shot (?shot=cover|smoke|alarm|getaway) freezes the game in a
// fixed mid-heist moment so screenshots are stable renders of real play.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  if (!stageShot(game, shot)) {
    document.title = `Unknown shot: ${shot}`;
  }
} else {
  game.phase = PHASES.TITLE;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.shotFrozen) updateGame(game, input, dt);
  renderGame(ctx, game);
  endFrameInput(input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
