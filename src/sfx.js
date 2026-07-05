// Lightweight synthesized sound effects using the Web Audio API.
// No audio files required — every sound is generated on the fly, so it stays
// in-repo and works offline. Sounds are muted until the user interacts (browser
// autoplay policy) and can be toggled off entirely.

let ctx = null;
let muted = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
}

export function toggleMuted() {
  muted = !muted;
  if (!muted) {
    // Warm up / resume the context on the same user gesture that unmutes.
    const c = getCtx();
    if (c && c.state === "suspended") c.resume();
  }
  return muted;
}

// A single oscillator "voice" with an amplitude envelope.
function tone({ freq = 440, type = "sine", start = 0, dur = 0.2, gain = 0.2, glideTo = null } = {}) {
  const c = getCtx();
  if (!c || muted) return;
  const now = c.currentTime + start;
  const osc = c.createOscillator();
  const amp = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (glideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), now + dur);
  }

  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(amp).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

// A short burst of filtered noise — used for paper/stamp textures.
function noise({ start = 0, dur = 0.2, gain = 0.15, type = "highpass", freq = 1200 } = {}) {
  const c = getCtx();
  if (!c || muted) return;
  const now = c.currentTime + start;
  const frames = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;

  const amp = c.createGain();
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(filter).connect(amp).connect(c.destination);
  src.start(now);
  src.stop(now + dur);
}

export const sfx = {
  // Soft UI click for buttons.
  click() {
    tone({ freq: 320, type: "triangle", dur: 0.08, gain: 0.12, glideTo: 260 });
  },

  // Paper page turn: a soft noise swish.
  pageTurn() {
    noise({ dur: 0.32, gain: 0.12, type: "bandpass", freq: 900 });
    noise({ start: 0.08, dur: 0.22, gain: 0.08, type: "highpass", freq: 2200 });
  },

  // Correct answer: a bright rising arpeggio.
  correct() {
    [523.25, 659.25, 783.99].forEach((f, i) => {
      tone({ freq: f, type: "sine", start: i * 0.09, dur: 0.22, gain: 0.16 });
    });
  },

  // Wrong answer: a short low buzz.
  wrong() {
    tone({ freq: 180, type: "sawtooth", dur: 0.22, gain: 0.12, glideTo: 120 });
  },

  // Ink stamp slam: a thud plus a paper-noise snap.
  stamp() {
    tone({ freq: 90, type: "sine", dur: 0.18, gain: 0.28, glideTo: 55 });
    noise({ dur: 0.16, gain: 0.22, type: "lowpass", freq: 800 });
  },

  // Rank up / promotion: a small triumphant flourish.
  rankUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone({ freq: f, type: "triangle", start: i * 0.08, dur: 0.28, gain: 0.16 });
    });
  },

  // Mission complete fanfare.
  finale() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((f, i) => {
      tone({ freq: f, type: "triangle", start: i * 0.12, dur: 0.4, gain: 0.15 });
    });
    tone({ freq: 261.63, type: "sine", start: 0, dur: 0.9, gain: 0.1 });
  },
};
