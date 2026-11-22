// The Velvet Vault — the three nights: rooms, patrols, cameras, loot.
// One job: the data for each heist. Nothing here moves; guards.js and
// cameras.js do the moving, game.js does the scoring.
//
// A wall is { x, y, w, h, kind }: 'case' and 'statue' block sight and
// movement, 'rope' blocks movement only (you can be seen over the
// velvet rope). Every night fits the same museum shell: north-wall
// paintings, a red carpet down the middle, and three ways across —
// the north gallery, the carpet, and the south hall.

import { FLOOR } from './config.js';

export const LEVELS = [
  {
    id: 1,
    name: 'Night 1 — The Duchess Gallery',
    sub: 'Lift the Laughing Duchess and the Star Sapphire, then slip out the east door.',
    requiredLoot: 2,
    targetValue: 0,
    walls: [
      // Display cases down the middle — cover to duck behind.
      { x: 320, y: 300, w: 90, h: 60, kind: 'case' }, // west case
      { x: 560, y: 200, w: 90, h: 60, kind: 'case' }, // north-centre case
      { x: 560, y: 430, w: 90, h: 60, kind: 'case' }, // south-centre case
      { x: 800, y: 300, w: 90, h: 60, kind: 'case' }, // east case
      // Marble statues — tall cover.
      { x: 430, y: 130, w: 54, h: 54, kind: 'statue' }, // north-west statue
      { x: 430, y: 520, w: 54, h: 54, kind: 'statue' }, // south-west statue
      { x: 950, y: 130, w: 54, h: 54, kind: 'statue' }, // north-east statue
      { x: 950, y: 520, w: 54, h: 54, kind: 'statue' }, // south-east statue
      // Velvet ropes guarding the paintings (seen over, not through).
      { x: 300, y: 118, w: 220, h: 10, kind: 'rope' }, // west rope
      { x: 760, y: 118, w: 220, h: 10, kind: 'rope' }, // east rope
    ],
    guards: [
      {
        name: 'Marco',
        waypoints: [
          { x: 300, y: 330 },
          { x: 640, y: 330 },
          { x: 640, y: 560 },
          { x: 300, y: 560 },
        ],
        speed: 62,
        range: 200,
        halfAngle: 0.55,
      },
      {
        name: 'Inez',
        waypoints: [
          { x: 980, y: 180 },
          { x: 980, y: 560 },
          { x: 700, y: 560 },
          { x: 700, y: 180 },
        ],
        speed: 58,
        range: 190,
        halfAngle: 0.55,
      },
    ],
    cameras: [
      {
        x: 640, y: 92,
        baseAngle: Math.PI / 2,
        sweep: 0.9,
        speed: 0.45,
        range: 250,
        halfAngle: 0.42,
      },
      {
        x: 1080, y: 668,
        baseAngle: -Math.PI / 2,
        sweep: 0.8,
        speed: 0.55,
        range: 240,
        halfAngle: 0.42,
      },
    ],
    loot: [
      { id: 'duchess', kind: 'painting', x: 410, y: 100, value: 1200, label: 'The Laughing Duchess' },
      { id: 'sapphire', kind: 'gem', x: 605, y: 330, value: 900, label: 'Star Sapphire' },
      { id: 'scarab', kind: 'scarab', x: 1130, y: 600, value: 700, label: 'Golden Scarab' },
    ],
    coins: [
      { x: 180, y: 180 }, // north-west corner
      { x: 180, y: 560 }, // south-west corner
      { x: 500, y: 620 }, // south edge, centre-left
      { x: 760, y: 180 }, // north edge, centre-right
      { x: 1120, y: 180 }, // north-east corner
      { x: 1120, y: 420 }, // east edge
    ],
    spawn: { x: 70, y: 600 },
    exit: { x: 1240, y: 320, w: 16, h: 90, label: 'GETAWAY DOOR' },
  },
  {
    id: 2,
    name: 'Night 2 — The Vault Corridor',
    sub: 'Three guards, three cameras. The vault case holds the Duchess Crown.',
    requiredLoot: 2,
    targetValue: 0,
    walls: [
      { x: 280, y: 180, w: 90, h: 60, kind: 'case' }, // north-west case
      { x: 280, y: 470, w: 90, h: 60, kind: 'case' }, // south-west case
      { x: 520, y: 330, w: 90, h: 60, kind: 'case' }, // centre case
      { x: 760, y: 180, w: 90, h: 60, kind: 'case' }, // north-east case
      { x: 760, y: 470, w: 90, h: 60, kind: 'case' }, // south-east case
      { x: 1000, y: 330, w: 90, h: 60, kind: 'case' }, // far-east case
      { x: 400, y: 130, w: 54, h: 54, kind: 'statue' }, // north statue
      { x: 880, y: 130, w: 54, h: 54, kind: 'statue' }, // north-east statue
      { x: 640, y: 520, w: 54, h: 54, kind: 'statue' }, // south statue
      { x: 300, y: 118, w: 220, h: 10, kind: 'rope' }, // west rope
      { x: 760, y: 118, w: 220, h: 10, kind: 'rope' }, // east rope
    ],
    guards: [
      {
        name: 'Marco',
        waypoints: [
          { x: 220, y: 330 },
          { x: 560, y: 330 },
          { x: 560, y: 600 },
          { x: 220, y: 600 },
        ],
        speed: 70,
        range: 205,
        halfAngle: 0.55,
      },
      {
        name: 'Inez',
        waypoints: [
          { x: 900, y: 160 },
          { x: 1180, y: 160 },
          { x: 1180, y: 560 },
          { x: 900, y: 560 },
        ],
        speed: 66,
        range: 200,
        halfAngle: 0.55,
      },
      {
        name: 'Otto',
        waypoints: [
          { x: 640, y: 150 },
          { x: 640, y: 620 },
          { x: 820, y: 620 },
          { x: 820, y: 150 },
        ],
        speed: 60,
        range: 195,
        halfAngle: 0.5,
      },
    ],
    cameras: [
      {
        x: 400, y: 92,
        baseAngle: Math.PI / 2,
        sweep: 1.0,
        speed: 0.55,
        range: 260,
        halfAngle: 0.42,
      },
      {
        x: 640, y: 92,
        baseAngle: Math.PI / 2,
        sweep: 1.0,
        speed: 0.5,
        range: 260,
        halfAngle: 0.42,
      },
      {
        x: 1180, y: 668,
        baseAngle: -Math.PI / 2,
        sweep: 0.9,
        speed: 0.6,
        range: 250,
        halfAngle: 0.42,
      },
    ],
    loot: [
      { id: 'crown', kind: 'gem', x: 565, y: 360, value: 1500, label: 'Duchess Crown' },
      { id: 'duchess', kind: 'painting', x: 410, y: 100, value: 1200, label: 'The Laughing Duchess' },
      { id: 'vase', kind: 'vase', x: 870, y: 100, value: 800, label: 'Ming-Style Vase' },
      { id: 'scarab', kind: 'scarab', x: 1130, y: 600, value: 700, label: 'Golden Scarab' },
    ],
    coins: [
      { x: 150, y: 150 }, // north-west corner
      { x: 150, y: 600 }, // south-west corner
      { x: 450, y: 620 }, // south edge
      { x: 700, y: 150 }, // north edge
      { x: 1060, y: 620 }, // south-east
      { x: 1180, y: 300 }, // east edge
    ],
    spawn: { x: 70, y: 600 },
    exit: { x: 1240, y: 320, w: 16, h: 90, label: 'GETAWAY DOOR' },
  },
  {
    id: 3,
    name: 'Night 3 — The Grand Vault',
    sub: 'The full crew is on. Take any two masterpieces — the vault will not wait.',
    requiredLoot: 2,
    targetValue: 0,
    walls: [
      { x: 260, y: 220, w: 90, h: 60, kind: 'case' }, // west-north case
      { x: 260, y: 440, w: 90, h: 60, kind: 'case' }, // west-south case
      { x: 500, y: 330, w: 90, h: 60, kind: 'case' }, // centre case
      { x: 700, y: 180, w: 90, h: 60, kind: 'case' }, // north case
      { x: 700, y: 480, w: 90, h: 60, kind: 'case' }, // south case
      { x: 940, y: 330, w: 90, h: 60, kind: 'case' }, // east case
      { x: 380, y: 130, w: 54, h: 54, kind: 'statue' }, // north-west statue
      { x: 620, y: 520, w: 54, h: 54, kind: 'statue' }, // south statue
      { x: 900, y: 130, w: 54, h: 54, kind: 'statue' }, // north-east statue
      { x: 1080, y: 520, w: 54, h: 54, kind: 'statue' }, // south-east statue
      { x: 300, y: 118, w: 220, h: 10, kind: 'rope' }, // west rope
      { x: 760, y: 118, w: 220, h: 10, kind: 'rope' }, // east rope
    ],
    guards: [
      {
        name: 'Marco',
        waypoints: [
          { x: 200, y: 200 },
          { x: 620, y: 200 },
          { x: 620, y: 620 },
          { x: 200, y: 620 },
        ],
        speed: 78,
        range: 210,
        halfAngle: 0.55,
      },
      {
        name: 'Inez',
        waypoints: [
          { x: 1080, y: 160 },
          { x: 1080, y: 620 },
          { x: 760, y: 620 },
          { x: 760, y: 160 },
        ],
        speed: 74,
        range: 205,
        halfAngle: 0.55,
      },
      {
        name: 'Otto',
        waypoints: [
          { x: 640, y: 140 },
          { x: 640, y: 620 },
        ],
        speed: 68,
        range: 200,
        halfAngle: 0.5,
      },
      {
        name: 'Rosa',
        waypoints: [
          { x: 320, y: 620 },
          { x: 1180, y: 620 },
          { x: 1180, y: 140 },
          { x: 320, y: 140 },
        ],
        speed: 64,
        range: 195,
        halfAngle: 0.55,
      },
    ],
    cameras: [
      {
        x: 320, y: 92,
        baseAngle: Math.PI / 2,
        sweep: 1.1,
        speed: 0.65,
        range: 270,
        halfAngle: 0.42,
      },
      {
        x: 640, y: 92,
        baseAngle: Math.PI / 2,
        sweep: 1.1,
        speed: 0.6,
        range: 270,
        halfAngle: 0.42,
      },
      {
        x: 960, y: 92,
        baseAngle: Math.PI / 2,
        sweep: 1.1,
        speed: 0.65,
        range: 270,
        halfAngle: 0.42,
      },
      {
        x: 640, y: 668,
        baseAngle: -Math.PI / 2,
        sweep: 1.0,
        speed: 0.6,
        range: 260,
        halfAngle: 0.42,
      },
    ],
    loot: [
      { id: 'crown', kind: 'gem', x: 545, y: 360, value: 1800, label: 'Duchess Crown' },
      { id: 'duchess', kind: 'painting', x: 410, y: 100, value: 1200, label: 'The Laughing Duchess' },
      { id: 'vase', kind: 'vase', x: 870, y: 100, value: 800, label: 'Ming-Style Vase' },
      { id: 'scarab', kind: 'scarab', x: 1130, y: 600, value: 700, label: 'Golden Scarab' },
      { id: 'mask', kind: 'mask', x: 120, y: 330, value: 950, label: 'Jade Mask' },
    ],
    coins: [
      { x: 150, y: 150 }, // north-west corner
      { x: 150, y: 600 }, // south-west corner
      { x: 450, y: 620 }, // south edge
      { x: 700, y: 150 }, // north edge
      { x: 1060, y: 620 }, // south-east
      { x: 1180, y: 300 }, // east edge
    ],
    spawn: { x: 70, y: 600 },
    exit: { x: 1240, y: 320, w: 16, h: 90, label: 'GETAWAY DOOR' },
  },
];

// Rectangles that block sight: cases and statues (ropes do not).
export function occluders(level) {
  return level.walls.filter((w) => w.kind !== 'rope');
}

// Rectangles that block movement: every wall, plus the room shell itself.
export function solids(level) {
  return level.walls;
}

export function roomBounds() {
  return FLOOR;
}
