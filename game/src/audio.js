// Dapur Kilat — audio.js
// Every sound is generated in code with WebAudio: no audio files, no network.
// The kitchen talks back at once — a chop thunk, a pan sizzle, a bell ding —
// so chopping and plating answer the player's hands immediately.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  /** Create the context on the first real gesture (browsers demand one). */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      return true;
    } catch {
      return false;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  /** A short oscillator blip: frequency, duration, wave, gain, slide-to. */
  blip(freq, dur, type = 'sine', gain = 0.12, slideTo = 0) {
    if (this.muted || !this.ensure()) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  /** A burst of filtered noise, for chops, sizzles and thuds. */
  noise(dur, filterFreq, gain = 0.2, type = 'bandpass') {
    if (this.muted || !this.ensure()) return;
    try {
      const t = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = filterFreq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter).connect(g).connect(this.ctx.destination);
      src.start(t);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  click() { this.blip(660, 0.06, 'triangle', 0.08); }
  pick() { this.blip(520, 0.07, 'triangle', 0.1, 780); }
  chop() { this.noise(0.09, 900, 0.35, 'lowpass'); this.blip(180, 0.08, 'square', 0.1, 90); }
  chopDone() { this.chop(); this.blip(880, 0.12, 'triangle', 0.1, 1320); }
  place() { this.noise(0.08, 500, 0.2, 'lowpass'); this.blip(300, 0.08, 'triangle', 0.09); }
  plate() { this.blip(740, 0.09, 'triangle', 0.12); this.blip(1108, 0.14, 'triangle', 0.1); }
  ding() { this.blip(1174, 0.35, 'sine', 0.14); this.blip(1568, 0.5, 'sine', 0.1); }
  serve() {
    this.ding();
    setTimeout(() => this.blip(880, 0.18, 'triangle', 0.12, 1174), 120);
    setTimeout(() => this.blip(1318, 0.25, 'triangle', 0.1), 240);
  }
  error() { this.blip(220, 0.18, 'sawtooth', 0.1, 140); }
  burn() { this.noise(0.4, 300, 0.25, 'lowpass'); this.blip(160, 0.3, 'sawtooth', 0.08, 90); }
  tick() { this.blip(980, 0.05, 'square', 0.05); }
  start() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.blip(f, 0.16, 'triangle', 0.12), i * 110)); }
  gameOver() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.blip(f, 0.3, 'triangle', 0.12), i * 180)); }

  /** A looping pan sizzle while anything fries; stops when the last burner empties. */
  startSizzle() {
    if (this.muted || !this.ensure() || this.sizzleNodes) return;
    try {
      const len = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2500;
      const g = this.ctx.createGain();
      g.gain.value = 0.035;
      src.connect(filter).connect(g).connect(this.ctx.destination);
      src.start();
      this.sizzleNodes = { src, g };
    } catch {
      this.sizzleNodes = null;
    }
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try {
      this.sizzleNodes.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      const nodes = this.sizzleNodes;
      setTimeout(() => { try { nodes.src.stop(); } catch { /* already stopped */ } }, 300);
    } catch {
      // Sound is garnish: never let it break the game.
    }
    this.sizzleNodes = null;
  }
}
