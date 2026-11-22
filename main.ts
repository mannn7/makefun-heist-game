// The Velvet Vault — a museum heist game, handed in for make.fun's
// best-heist-game-20261122-0559 bounty (Node 22, standard library only).
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and
// no network request). This program copies game/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary
// the judge reads, with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const entryDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The copy below is byte-for-byte deterministic: the same repository files
// go in every time, and buildDossier writes no timestamps or random values,
// so the grader's two runs of this program produce identical /output trees.
mkdirSync(outputDir, { recursive: true });
cpSync(join(entryDir, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
// Screenshots are optional for the gate: copy them only when the folder
// exists, so an entry without screenshots still runs instead of crashing.
if (existsSync(join(entryDir, 'screenshots'))) cpSync(join(entryDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

// The scorer's own caps, named once so the hand-in call below reads
// plainly: only text_max_bytes shapes the bytes; the others refuse an
// entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in game/ or 48 MiB of game files, in
// all, or a path under game/ over 1000 bytes).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, DOSSIER_CAPS),
);
