/**
 * KenEasy WaveForge - Audio Engine
 * Pure Web Audio API: decoding, peak analysis, real-time frequency extraction,
 * built-in procedural synthesizer for demo playback, and stream routing for video recording.
 */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.gainNode = null;
    this.streamDestination = null;
    this.sourceNode = null;

    this.audioBuffer = null;
    this.peaks = [];
    this.fileName = '';
    this.duration = 0;

    this.isPlaying = false;
    this.playbackStartTime = 0;
    this.pausedAt = 0;
    this.trimStart = 0;
    this.trimEnd = 0;

    this.onStateChange = null;
    this.onEnded = null;

    this.freqData = null;
    this.timeData = null;
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = CONFIG.DEFAULTS.fftSize;
      this.analyser.smoothingTimeConstant = CONFIG.DEFAULTS.smoothingTimeConstant;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = CONFIG.DEFAULTS.audioGain;

      // Stream destination for MediaRecorder (video export)
      this.streamDestination = this.audioCtx.createMediaStreamDestination();

      // Audio Graph: Source -> Analyser -> Gain -> Hardware Destination & Stream Destination
      this.gainNode.connect(this.audioCtx.destination);
      this.gainNode.connect(this.streamDestination);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setGain(val) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(2.5, val));
    }
  }

  setSmoothing(val) {
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = Math.max(0.1, Math.min(0.95, val));
    }
  }

  async loadAudioFile(file) {
    this.ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

    this.stop();
    this.audioBuffer = decodedBuffer;
    this.fileName = file.name.replace(/\.[^/.]+$/, '');
    this.duration = decodedBuffer.duration;
    this.trimStart = 0;
    this.trimEnd = this.duration;
    this.pausedAt = 0;

    this.computePeaks();
    return {
      duration: this.duration,
      sampleRate: decodedBuffer.sampleRate,
      numberOfChannels: decodedBuffer.numberOfChannels,
      fileName: this.fileName,
      peaks: this.peaks,
    };
  }

  /**
   * Generates a pleasant 12-second rhythmic Synthwave / Lo-Fi loop purely using Web Audio API
   * Zero external file dependencies, instant zero-lag loading!
   */
  async generateDemoBuffer() {
    this.ensureContext();
    const sampleRate = this.audioCtx.sampleRate;
    const duration = 12.0;
    const totalSamples = Math.floor(sampleRate * duration);
    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    // BPM & Beat metrics
    const bpm = 110;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;

    // 1. Kick Drum Synthesizer
    const makeKick = (time) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

      gain.gain.setValueAtTime(0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(time);
      osc.stop(time + 0.25);
    };

    // 2. Snare / Clack
    const makeSnare = (time) => {
      // Noise component
      const noiseBuffer = offlineCtx.createBuffer(1, Math.floor(sampleRate * 0.18), sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = offlineCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 800;

      const noiseGain = offlineCtx.createGain();
      noiseGain.gain.setValueAtTime(0.4, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(offlineCtx.destination);
      whiteNoise.start(time);
      whiteNoise.stop(time + 0.18);
    };

    // 3. Hi-Hat
    const makeHiHat = (time, accent = false) => {
      const noiseBuffer = offlineCtx.createBuffer(1, Math.floor(sampleRate * 0.05), sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const src = offlineCtx.createBufferSource();
      src.buffer = noiseBuffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;

      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(accent ? 0.3 : 0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);
      src.start(time);
      src.stop(time + 0.05);
    };

    // 4. Bass Line (Warm Analog Sawtooth / Triangle)
    const bassNotes = [55, 55, 65.4, 73.4, 49, 49, 55, 65.4]; // A1, C2, D2, G1...
    bassNotes.forEach((freq, idx) => {
      const noteTime = idx * (beatSec * 2);
      if (noteTime >= duration) return;

      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      const filter = offlineCtx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, noteTime);
      filter.frequency.exponentialRampToValueAtTime(200, noteTime + beatSec * 1.5);

      gain.gain.setValueAtTime(0.45, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + beatSec * 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + beatSec * 1.8);
    });

    // 5. Arpeggio / Melody (Neon Synth Pentatonic Lead)
    const melodyScale = [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25, 587.33];
    const sixteenth = beatSec / 4;
    const totalSixteenths = Math.floor(duration / sixteenth);
    for (let s = 0; s < totalSixteenths; s++) {
      const t = s * sixteenth;
      // Arp pattern
      const noteIndex = (s * 3) % melodyScale.length;
      const freq = melodyScale[noteIndex];

      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      osc.type = s % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + sixteenth * 1.2);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(t);
      osc.stop(t + sixteenth * 1.2);
    }

    // Schedule Drums throughout the 12s loop
    for (let b = 0; b < duration; b += beatSec) {
      const beatIdx = Math.round(b / beatSec) % 4;
      if (beatIdx === 0 || beatIdx === 2) {
        makeKick(b);
      }
      if (beatIdx === 1 || beatIdx === 3) {
        makeSnare(b);
      }
      makeHiHat(b, true);
      makeHiHat(b + beatSec / 2, false);
    }

    const rendered = await offlineCtx.startRendering();
    this.stop();
    this.audioBuffer = rendered;
    this.fileName = 'KenEasy-Synthwave-Demo';
    this.duration = rendered.duration;
    this.trimStart = 0;
    this.trimEnd = this.duration;
    this.pausedAt = 0;

    this.computePeaks();
    return {
      duration: this.duration,
      sampleRate: rendered.sampleRate,
      numberOfChannels: rendered.numberOfChannels,
      fileName: this.fileName,
      peaks: this.peaks,
    };
  }

  computePeaks(bars = 160) {
    if (!this.audioBuffer) return [];
    const channelData = this.audioBuffer.getChannelData(0);
    const step = Math.floor(channelData.length / bars);
    const peaks = new Float32Array(bars);

    for (let i = 0; i < bars; i++) {
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      let max = 0;
      for (let j = start; j < end; j += 4) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      peaks[i] = max;
    }
    this.peaks = peaks;
    return peaks;
  }

  play(fromTime = null) {
    if (!this.audioBuffer) return;
    this.ensureContext();

    if (this.isPlaying) {
      this.pause();
    }

    let startOffset = fromTime !== null ? fromTime : this.pausedAt;
    if (startOffset < this.trimStart || startOffset >= this.trimEnd) {
      startOffset = this.trimStart;
    }

    const playDuration = Math.max(0.1, this.trimEnd - startOffset);

    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.gainNode);

    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pausedAt = this.trimStart;
        if (this.onEnded) this.onEnded();
        if (this.onStateChange) this.onStateChange(false);
      }
    };

    this.sourceNode.start(0, startOffset, playDuration);
    this.playbackStartTime = this.audioCtx.currentTime - startOffset;
    this.isPlaying = true;

    if (this.onStateChange) this.onStateChange(true);
  }

  pause() {
    if (!this.isPlaying) return;
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }
    this.pausedAt = this.getCurrentTime();
    this.isPlaying = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  stop() {
    this.pause();
    this.pausedAt = this.trimStart;
  }

  seek(time) {
    const clamped = Math.max(0, Math.min(this.duration, time));
    this.pausedAt = clamped;
    if (this.isPlaying) {
      this.play(clamped);
    }
  }

  setTrim(start, end) {
    this.trimStart = Math.max(0, Math.min(start, this.duration));
    this.trimEnd = Math.max(this.trimStart + 0.5, Math.min(end, this.duration));
    if (this.pausedAt < this.trimStart || this.pausedAt > this.trimEnd) {
      this.pausedAt = this.trimStart;
    }
  }

  getCurrentTime() {
    if (!this.audioBuffer) return 0;
    if (this.isPlaying && this.audioCtx) {
      const cur = this.audioCtx.currentTime - this.playbackStartTime;
      return Math.min(cur, this.trimEnd);
    }
    return this.pausedAt;
  }

  getFrequencyData() {
    if (!this.analyser || !this.freqData) return null;
    this.analyser.getByteFrequencyData(this.freqData);
    return this.freqData;
  }

  getTimeDomainData() {
    if (!this.analyser || !this.timeData) return null;
    this.analyser.getByteTimeDomainData(this.timeData);
    return this.timeData;
  }

  getStreamDestination() {
    this.ensureContext();
    return this.streamDestination;
  }
}

if (typeof window !== 'undefined') {
  window.AudioEngine = AudioEngine;
}
