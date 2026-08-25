// High-Fidelity Ambient Spa Soundscape Engine using Web Audio API
// Optimized for clear, rich, relaxing audio on all speakers and headphones

class SpaSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private isRunning: boolean = false;
  private lastChimeTime: number = 0;

  private init() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Gain Node
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Crystal Water Stream
    this.setupWaterStream();

    // 2. Harmonic 432Hz Sanctuary Ambient Pad
    this.setupSanctuaryPad();
  }

  private setupWaterStream() {
    if (!this.ctx || !this.masterGain) return;

    // 2-second stereo noise loop
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter algorithm for natural organic water texture
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.1) * 0.35;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Dual bandpass filter for bubbling fountain water realism
    const waterFilter = this.ctx.createBiquadFilter();
    waterFilter.type = "bandpass";
    waterFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    waterFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // Subtle water LFO wave motion
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.25, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(350, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(waterFilter.frequency);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    noiseSource.connect(waterFilter);
    waterFilter.connect(this.waterGain);
    this.waterGain.connect(this.masterGain);

    noiseSource.start();
    lfo.start();
  }

  private setupSanctuaryPad() {
    if (!this.ctx || !this.masterGain) return;

    // Warm, uplifting 432Hz Pythagorean chord (A4, C#5, E5 + deep sub)
    const chordFrequencies = [216, 432, 540, 648];

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.droneGain.connect(this.masterGain);

    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    padFilter.connect(this.droneGain);

    chordFrequencies.forEach((freq, idx) => {
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.detune.setValueAtTime((idx - 1.5) * 5, this.ctx.currentTime);

      const vol = 0.22 / (idx + 1);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(padFilter);
      osc.start();
    });
  }

  // Resonant Singing Bowl chime
  public triggerSingingBowl(freq = 528) {
    if (!this.ctx || !this.masterGain || !this.isRunning) return;

    const now = this.ctx.currentTime;
    if (now - this.lastChimeTime < 1.5) return;
    this.lastChimeTime = now;

    // Fundamental note + harmonic overtone
    [freq, freq * 1.5].forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);

      const peakVol = idx === 0 ? 0.3 : 0.15;
      chimeGain.gain.setValueAtTime(0, now);
      chimeGain.gain.linearRampToValueAtTime(peakVol, now + 0.04);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(chimeGain);
      chimeGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 4.6);
    });
  }

  public updateScroll(progress: number, _velocity: number) {
    if (!this.ctx || !this.waterGain || !this.isRunning) return;

    const now = this.ctx.currentTime;
    // Water intensity responds to thermal water acts
    const waterVol = 0.3 + Math.sin(progress * Math.PI) * 0.2;
    this.waterGain.gain.setTargetAtTime(waterVol, now, 0.2);
  }

  public async start(): Promise<boolean> {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return false;

      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      // Smooth 0.8s fade-in to audible volume level
      this.masterGain.gain.linearRampToValueAtTime(0.85, now + 0.8);
      this.isRunning = true;

      // Opening singing bowl chime
      this.triggerSingingBowl(528);
      return true;
    } catch (e) {
      console.error("Failed to start soundscape:", e);
      return false;
    }
  }

  public stop() {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    // Smooth 0.6s fade-out
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    this.isRunning = false;
  }

  public toggle(): Promise<boolean> {
    if (this.isRunning) {
      this.stop();
      return Promise.resolve(false);
    } else {
      return this.start();
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const spaSoundscape = typeof window !== "undefined" ? new SpaSoundscape() : (null as any);
