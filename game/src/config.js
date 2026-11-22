// The Velvet Vault — shared constants: palette, sizes, tuning.
// One job: every magic number the rest of the game agrees on lives here.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;

// Playable room bounds (inside the museum's outer walls).
export const ROOM = { x: 24, y: HUD_H + 16, w: 1232, h: 600 };

// Palette: a night museum — deep blue-black, warm gold, velvet red.
export const PALETTE = {
  floorA: '#1c1a26',
  floorB: '#211e2e',
  floorLine: '#2e2a40',
  carpet: '#5e1620',
  carpetEdge: '#8a2432',
  wall: '#0d0b14',
  wallTop: '#3a3352',
  pedestal: '#4a4238',
  pedestalTop: '#6b5f4d',
  statue: '#8f86a0',
  rope: '#a01e2e',
  gold: '#e8b64c',
  goldDim: '#9c7a2e',
  lootGlow: '#ffd76a',
  guardBody: '#3f6fb5',
  guardCone: 'rgba(255, 214, 90, 0.20)',
  guardConeAlert: 'rgba(255, 64, 64, 0.30)',
  cameraCone: 'rgba(120, 220, 255, 0.16)',
  cameraConeAlert: 'rgba(255, 64, 64, 0.28)',
  thief: '#14101c',
  thiefTrim: '#e8b64c',
  smoke: 'rgba(200, 200, 210, 0.35)',
  text: '#f2ead8',
  textDim: '#b9ae94',
  danger: '#ff5252',
  safe: '#7ee081',
};

// Player tuning.
export const PLAYER = {
  radius: 13,
  walkSpeed: 205, // px per second
  sneakSpeed: 105,
  grabRadius: 34, // how close to loot to collect it (key E or walk-over)
  seenRadius: 150, // distance at which a guard notices even outside a cone
};

// Alarm tuning.
export const ALARM = {
  guardSpotRate: 34, // per second while fully seen by a guard cone
  cameraSpotRate: 46, // per second while seen by a camera cone
  chaseSpotRate: 60,
  decayRate: 7, // per second while nobody sees the thief
  lockdownAt: 100,
};

// Tools the thief can buy with coins and spend mid-heist.
export const TOOLS = {
  emp: { key: '1', name: 'EMP Burst', price: 60, max: 2, desc: 'Kills every camera for 8s' },
  noise: { key: '2', name: 'Noisemaker', price: 30, max: 3, desc: 'Lures the nearest guard away' },
  smoke: { key: '3', name: 'Smoke Bomb', price: 50, max: 2, desc: 'Hides you inside a cloud for 6s' },
};

export const EMP_DURATION = 8;
export const SMOKE_DURATION = 6;
export const NOISE_LURE_SECONDS = 6;

// Scoring.
export const SCORE = {
  coinPickup: 25,
  nightBonusPerSecondLeft: 2,
};

// Night length in seconds (the cleaner arrives when it hits zero).
export const NIGHT_SECONDS = 300;
