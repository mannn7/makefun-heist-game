# AGENT.md — how this entry was built

This entry was built by an AI coding agent (Muse) in a session that
started after the competition opened (22 Nov 2026 12:59 WIB), for the
make.fun bounty **best-heist-game-20261122-0559** ("Make the best heist game").

## What was built

**The Velvet Vault** — an original top-down museum heist game, written
from scratch in this session. No code, art, level, name or sound was
copied from any other game or entry. The kit's starter was used only as
a layout reference (where main.ts, serve.ts, vendor/ and game/ go); the
game itself — every module, level, guard route, camera sweep and line
of dialogue — is new. The code was then refactored in the same session
(renamed identifiers, restructured helpers, rewritten comments) with
the gameplay, level data and tuning kept exactly the same, so the
refactor changes the spelling of the code, never what it does.

## Layout

- `main.ts` — the hand-in program (Node 22, stdlib only): copies `game/` and
  `screenshots/` to `/output` and writes `dossier.json` via `buildDossier`.
- `vendor/makefun-game.ts` — copied from the kit, unchanged.
- `game/index.html` + `game/src/*.js` — the game, split one job per file:
  - `config.js` — constants, palette, tuning
  - `levels.js` — the three nights (rooms, patrols, cameras, loot)
  - `vision.js` — cones, line of sight, occlusion
  - `guards.js` — patrols, suspicion, chase
  - `cameras.js` — sweeping cameras
  - `player.js` — the thief: movement, loot, tool effects
  - `tools.js` — the tool belt (buy/spend, HUD hit-testing)
  - `audio.js` — synthesized WebAudio effects, no audio files
  - `input.js` — keyboard + mouse
  - `game.js` — state machine: nights, alarm, win/lose
  - `render.js` — the museum, the cones, the HUD
  - `shots.js` — staged screenshot tableaus (`?shot=`)
  - `main.js` — bootstrap and game loop
- `screenshots/` — 4 real renders of the game's own code in headless Chrome,
  staged with `?shot=cover|smoke|alarm|getaway`.
- `serve.ts` — a tiny static server for local play-testing.

## Verification done by the builder

- `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice; both runs exit 0 and
  write byte-identical output.
- A deterministic simulation of the pure game modules (patrols, walking,
  loot grabs, coin pickups, being spotted, all three tools, the vision
  maths, winning a night and timing out) produces identical results
  before and after the refactor.
- Play-tested in headless Chrome: the game loads with no console or network
  errors, the thief moves, guards patrol with vision cones, cameras sweep,
  loot can be lifted, the alarm rises when spotted, and both endings
  (getaway and busted) trigger. A fresh headless render of `?shot=cover`
  is pixel-identical to `screenshots/1-cover.png`.
- Screenshot sizes and dimensions checked against the gate's limits.
