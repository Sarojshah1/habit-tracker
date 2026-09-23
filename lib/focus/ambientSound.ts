/**
 * Pure Web Audio API Ambient Sound Synthesizer
 * Zero network dependencies, zero external files, 100% offline & instantaneous.
 */

export type AmbientSoundType = "none" | "brown" | "white" | "rain" | "binaural";

export interface AmbientSoundOption {
  id: AmbientSoundType;
  name: string;
  description: string;
  iconName: string;
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  { id: "none", name: "Off", description: "No background ambient audio", iconName: "VolumeX" },
  { id: "brown", name: "Brown Noise", description: "Deep soothing rumble for intense focus", iconName: "Waves" },
  { id: "white", name: "White Noise", description: "Constant masking noise for noisy rooms", iconName: "Wind" },
  { id: "rain", name: "Gentle Rain", description: "Soft rainfall ambient to relax the mind", iconName: "CloudRain" },
  { id: "binaural", name: "Binaural (40Hz)", description: "Gamma wave stimulation for problem solving", iconName: "Headphones" },
];

export class AmbientSoundManager {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = "none";
  private sourceNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private volume: number = 0.4;
  private isRunning: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.gainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentSound(): AmbientSoundType {
    return this.currentType;
  }

  public isSoundPlaying(): boolean {
    return this.isRunning && this.currentType !== "none";
  }

  public async play(type: AmbientSoundType) {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;

    if (type === "none") {
      this.stop();
      return;
    }

    // Stop current sound smoothly
    this.stopInternal();

    this.currentType = type;
    this.isRunning = true;

    try {
      if (type === "white") {
        this.playWhiteNoise();
      } else if (type === "brown") {
        this.playBrownNoise();
      } else if (type === "rain") {
        this.playRainSound();
      } else if (type === "binaural") {
        this.playBinauralBeat();
      }
    } catch (err) {
      console.warn("Failed to play ambient sound:", err);
    }
  }

  public stop() {
    this.stopInternal();
    this.currentType = "none";
    this.isRunning = false;
  }

  private stopInternal() {
    if (this.sourceNode) {
      try {
        if ("stop" in this.sourceNode && typeof (this.sourceNode as any).stop === "function") {
          (this.sourceNode as any).stop();
        }
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }
    if (this.filterNode) {
      try {
        this.filterNode.disconnect();
      } catch {}
      this.filterNode = null;
    }
  }

  /**
   * White Noise Generator
   */
  private playWhiteNoise() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.18;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.connect(this.gainNode);
    whiteNoise.start();

    this.sourceNode = whiteNoise;
  }

  /**
   * Brown Noise Generator (Leaky Integrator)
   */
  private playBrownNoise() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.2; // Gain compensation
    }

    const brownNoise = this.ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;
    brownNoise.connect(this.gainNode);
    brownNoise.start();

    this.sourceNode = brownNoise;
  }

  /**
   * Generative Gentle Rain Simulation (Pink Noise + Low-Pass Filter)
   */
  private playRainSound() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 3 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Filtered Pink Noise algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
      b6 = white * 0.115926;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    // Soft low pass filter to give soothing rain patter
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    rainSource.connect(filter);
    filter.connect(this.gainNode);
    rainSource.start();

    this.filterNode = filter;
    this.sourceNode = rainSource;
  }

  /**
   * Binaural Beat (40Hz Gamma Focus Frequency)
   * Left ear: 200 Hz, Right ear: 240 Hz
   */
  private playBinauralBeat() {
    if (!this.ctx || !this.gainNode) return;

    const merger = this.ctx.createChannelMerger(2);

    // Left channel oscillator (200Hz)
    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.setValueAtTime(200, this.ctx.currentTime);

    // Right channel oscillator (240Hz)
    const oscRight = this.ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.setValueAtTime(240, this.ctx.currentTime);

    // Gain nodes for soft volume
    const gainLeft = this.ctx.createGain();
    gainLeft.gain.setValueAtTime(0.08, this.ctx.currentTime);

    const gainRight = this.ctx.createGain();
    gainRight.gain.setValueAtTime(0.08, this.ctx.currentTime);

    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0);

    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1);

    merger.connect(this.gainNode);

    oscLeft.start();
    oscRight.start();

    // Composite source holder for cleanup
    this.sourceNode = {
      stop: () => {
        oscLeft.stop();
        oscRight.stop();
      },
      disconnect: () => {
        oscLeft.disconnect();
        oscRight.disconnect();
        gainLeft.disconnect();
        gainRight.disconnect();
        merger.disconnect();
      },
    } as any;
  }
}
