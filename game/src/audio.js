// The Velvet Vault — sound: small synthesized effects, no audio files.
// One job: beeps, chimes and the alarm pulse, all from a single
// WebAudio context created lazily on first use.

let sharedCtx = null;
let silenced = false;

function audioCtx() {
  if (!sharedCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    sharedCtx = new AC();
  }
  if (sharedCtx.state === 'suspended') sharedCtx.resume();
  return sharedCtx;
}

function blip(freq, seconds, type, gain, when = 0) {
  if (silenced) return;
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ac.currentTime + when);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + seconds);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + seconds + 0.02);
}

export function flipMute() {
  silenced = !silenced;
  return silenced;
}

export function chimePickup() {
  blip(880, 0.12, 'sine', 0.12);
  blip(1318, 0.18, 'sine', 0.1, 0.07);
}

export function chimeCoin() {
  blip(1568, 0.08, 'triangle', 0.08);
}

export function chimeBuy() {
  blip(523, 0.1, 'triangle', 0.1);
  blip(784, 0.14, 'triangle', 0.1, 0.08);
}

export function stingSpotted() {
  blip(220, 0.16, 'sawtooth', 0.09);
  blip(175, 0.22, 'sawtooth', 0.09, 0.1);
}

export function tickAlarm() {
  blip(1046, 0.09, 'square', 0.05);
}

export function stingCaught() {
  blip(330, 0.25, 'sawtooth', 0.12);
  blip(220, 0.3, 'sawtooth', 0.12, 0.18);
  blip(110, 0.5, 'sawtooth', 0.12, 0.4);
}

export function fanfareWin() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((n, i) => blip(n, 0.22, 'triangle', 0.11, i * 0.11));
}

export function blipTool() {
  blip(440, 0.1, 'sine', 0.1);
  blip(660, 0.12, 'sine', 0.08, 0.06);
}
