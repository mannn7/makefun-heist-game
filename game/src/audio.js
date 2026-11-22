// The Velvet Vault — sound: tiny synthesized effects, no audio files.
// One job: beeps, chimes and the alarm pulse, all from one WebAudio context.

let ctx = null;
let muted = false;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, seconds, type, gain, when = 0) {
  if (muted) return;
  const ac = audio();
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

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function playPickup() {
  tone(880, 0.12, 'sine', 0.12);
  tone(1318, 0.18, 'sine', 0.1, 0.07);
}

export function playCoin() {
  tone(1568, 0.08, 'triangle', 0.08);
}

export function playBuy() {
  tone(523, 0.1, 'triangle', 0.1);
  tone(784, 0.14, 'triangle', 0.1, 0.08);
}

export function playSpotted() {
  tone(220, 0.16, 'sawtooth', 0.09);
  tone(175, 0.22, 'sawtooth', 0.09, 0.1);
}

export function playAlarmTick() {
  tone(1046, 0.09, 'square', 0.05);
}

export function playCaught() {
  tone(330, 0.25, 'sawtooth', 0.12);
  tone(220, 0.3, 'sawtooth', 0.12, 0.18);
  tone(110, 0.5, 'sawtooth', 0.12, 0.4);
}

export function playWin() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((n, i) => tone(n, 0.22, 'triangle', 0.11, i * 0.11));
}

export function playTool() {
  tone(440, 0.1, 'sine', 0.1);
  tone(660, 0.12, 'sine', 0.08, 0.06);
}
