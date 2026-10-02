/**
 * Procedural Web Audio Engine for Cyberpunk Lo-Fi Lounge
 * Synthesizes 100% of audio locally with zero external audio files.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;

    // Channels
    this.channels = {
      rain: { gain: null, node: null, volume: 0.5 },
      drone: { gain: null, nodes: [], volume: 0.3 },
      vinyl: { gain: null, node: null, volume: 0.2 },
      binaural: { gain: null, nodes: [], volume: 0.25 }
    };
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Setup channels
    this.setupRain();
    this.setupDrone();
    this.setupVinyl();
    this.setupBinaural();
  }

  // --- Rain Generator (Filtered Pink Noise) ---
  setupRain() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make it sound like gentle rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(0);

    this.channels.rain.gain = gain;
    this.channels.rain.node = whiteNoise;
  }

  // --- Synthwave Cosmic Drone ---
  setupDrone() {
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
    droneGain.connect(this.masterGain);

    // Warm analog low-pass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);
    filter.connect(droneGain);

    // LFO to slowly sweep filter cutoff
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 0.08 Hz breath
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(100, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // 3 Detuned Oscillators (A minor / root chord)
    const freqs = [55.0, 110.0, 164.81]; // A1, A2, E3
    const oscs = freqs.map((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.detune.setValueAtTime((idx - 1) * 7, this.ctx.currentTime); // subtle chorus detune

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      osc.connect(subGain);
      subGain.connect(filter);
      osc.start();
      return osc;
    });

    this.channels.drone.gain = droneGain;
    this.channels.drone.nodes = [...oscs, lfo];
  }

  // --- Vinyl Crackle ---
  setupVinyl() {
    const bufferSize = this.ctx.sampleRate * 2;
    const crackleBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = crackleBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Occasional random pop/crackle impulse
      if (Math.random() < 0.0008) {
        data[i] = (Math.random() * 2 - 1) * 0.8;
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.015; // gentle hiss
      }
    }

    const crackleSource = this.ctx.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    crackleSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    crackleSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    crackleSource.start();

    this.channels.vinyl.gain = gain;
    this.channels.vinyl.node = crackleSource;
  }

  // --- Binaural Alpha Beat ---
  setupBinaural() {
    const binGain = this.ctx.createGain();
    binGain.gain.setValueAtTime(0, this.ctx.currentTime);
    binGain.connect(this.masterGain);

    // Left channel: 216 Hz, Right channel: 226 Hz (10 Hz Alpha frequency difference)
    const merger = this.ctx.createChannelMerger(2);

    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(216, this.ctx.currentTime);

    const oscRight = this.ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(226, this.ctx.currentTime);

    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);
    merger.connect(binGain);

    oscLeft.start();
    oscRight.start();

    this.channels.binaural.gain = binGain;
    this.channels.binaural.nodes = [oscLeft, oscRight];
  }

  // --- Soundboard & Chime Effects ---
  playChime() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 2.0);
    });
  }

  playZap() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playDroplet() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playSuccess() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const freqs = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.9);
    });
  }

  playTick() {
    if (!this.isPlaying) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMaster(forceState = null) {
    this.ensureContext();
    this.isPlaying = forceState !== null ? forceState : !this.isPlaying;

    const now = this.ctx.currentTime;
    for (const [key, channel] of Object.entries(this.channels)) {
      if (channel.gain) {
        const targetVol = this.isPlaying ? channel.volume : 0;
        channel.gain.gain.cancelScheduledValues(now);
        channel.gain.gain.linearRampToValueAtTime(targetVol, now + 0.2);
      }
    }
    return this.isPlaying;
  }

  setVolume(channelKey, val) {
    if (!this.channels[channelKey]) return;
    const normalized = Math.max(0, Math.min(1, val));
    this.channels[channelKey].volume = normalized;

    if (this.ctx && this.isPlaying && this.channels[channelKey].gain) {
      const now = this.ctx.currentTime;
      this.channels[channelKey].gain.gain.cancelScheduledValues(now);
      this.channels[channelKey].gain.linearRampToValueAtTime(normalized, now + 0.05);
    }
  }
}

window.soundEngine = new SoundEngine();
