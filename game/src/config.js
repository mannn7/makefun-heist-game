// The Velvet Vault — the single tuning table every module reads.
// One rule: a number lives here, never inline in gameplay code, so
// rebalancing the heist means editing this file and nothing else.
// It covers the stage size, the room bounds, the night palette, the
// thief's pace, how fast the alarm climbs, the tool shop, and the
// length of a night before the cleaner walks in.

export const STAGE_W = 1280;
export const STAGE_H = 720;
export const BAR_H = 64;

// The playable floor, inside the museum's outer walls.
export const FLOOR = { x: 24, y: BAR_H + 16, w: 1232, h: 600 };

// Night-museum palette: deep blue-black stone, warm gold, velvet red.
export const PALETTE = {
  floorLight: '#1c1a26',
  floorDark: '#211e2e',
  floorSeam: '#2e2a40',
  runner: '#5e1620',
  runnerTrim: '#8a2432',
  wallFill: '#0d0b14',
  wallTrim: '#3a3352',
  caseBase: '#4a4238',
  caseGlass: '#6b5f4d',
  marble: '#8f86a0',
  ropeLine: '#a01e2e',
  goldMain: '#e8b64c',
  goldSoft: '#9c7a2e',
  lootHalo: '#ffd76a',
  guardSuit: '#3f6fb5',
  coneGuard: 'rgba(255, 214, 90, 0.20)',
  coneGuardHot: 'rgba(255, 64, 64, 0.30)',
  coneCamera: 'rgba(120, 220, 255, 0.16)',
  coneCameraHot: 'rgba(255, 64, 64, 0.28)',
  thiefSuit: '#14101c',
  thiefGold: '#e8b64c',
  smokePuff: 'rgba(200, 200, 210, 0.35)',
  ink: '#f2ead8',
  inkSoft: '#b9ae94',
  alarmRed: '#ff5252',
  goGreen: '#7ee081',
};

// How the thief moves and how close a guard must be to notice on proximity.
export const PLAYER = {
  body: 13,
  walk: 205, // pixels per second, standing up
  sneak: 105, // pixels per second, crouched and quiet
  reach: 34, // how close to loot before E (or a walk-over) collects it
  notice: 150, // a guard spots the thief this close even outside its cone
};

// How the alarm meter moves: it climbs while anyone watches the thief
// and cools off while nobody does; at the lockdown value the vault seals.
export const ALARM = {
  fromGuard: 34, // points per second while fully seen by a guard cone
  fromCamera: 46, // points per second while seen by a camera cone
  fromChase: 60,
  coolDown: 7, // points per second while nobody sees the thief
  lockdown: 100,
};

// The kit the thief buys with coins and spends mid-heist.
export const TOOLS = {
  emp: {
    key: '1',
    name: 'EMP Burst',
    price: 60,
    max: 2,
    desc: 'Kills every camera for 8s',
  },
  noise: {
    key: '2',
    name: 'Noisemaker',
    price: 30,
    max: 3,
    desc: 'Lures the nearest guard away',
  },
  smoke: {
    key: '3',
    name: 'Smoke Bomb',
    price: 50,
    max: 2,
    desc: 'Hides you inside a cloud for 6s',
  },
};

export const EMP_SECONDS = 8;
export const SMOKE_SECONDS = 6;
export const LURE_SECONDS = 6;

// Scoring: small change per coin, and a bonus for every second left.
export const SCORE = {
  coin: 25,
  timeBonus: 2, // per second left on the clock at the getaway
};

// How long a night lasts in seconds; the cleaner arrives at zero.
export const NIGHT_LENGTH = 300;
