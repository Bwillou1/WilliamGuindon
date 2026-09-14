class CosmicAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private filter: BiquadFilterNode | null = null;

  public toggle(): boolean {
    if (!this.isEnabled) {
      this.start();
      return true;
    } else {
      this.stop();
      return false;
    }
  }

  public get active(): boolean {
    return this.isEnabled;
  }

  public start() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 2.5);

        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(280, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

        this.masterGain.connect(this.filter);
        this.filter.connect(this.ctx.destination);
      }

      // Drone chord frequencies (celestial harmonic fifths)
      const freqs = [65.41, 98.00, 130.81, 196.00]; // C2, G2, C3, G3
      this.oscillators = freqs.map((f, i) => {
        const osc = this.ctx!.createOscillator();
        const oscGain = this.ctx!.createGain();

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f + (Math.random() * 0.4 - 0.2), this.ctx!.currentTime);

        // Subtle detune LFO
        const lfo = this.ctx!.createOscillator();
        const lfoGain = this.ctx!.createGain();
        lfo.frequency.setValueAtTime(0.08 + i * 0.03, this.ctx!.currentTime);
        lfoGain.gain.setValueAtTime(0.8, this.ctx!.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        oscGain.gain.setValueAtTime(0.25 / freqs.length, this.ctx!.currentTime);
        osc.connect(oscGain);
        oscGain.connect(this.masterGain!);

        osc.start();
        return osc;
      });

      this.isEnabled = true;
    } catch {
      // Ignore audio permission or context restrictions
    }
  }

  public stop() {
    if (!this.ctx || !this.masterGain) return;
    try {
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
      setTimeout(() => {
        this.oscillators.forEach(o => {
          try { o.stop(); o.disconnect(); } catch {}
        });
        this.oscillators = [];
        this.isEnabled = false;
      }, 1000);
    } catch {
      this.isEnabled = false;
    }
  }

  public triggerShockwavePulse(intensity: number = 1.0) {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(523.25, now); // C5
      chimeOsc.frequency.exponentialRampToValueAtTime(130.81, now + 1.2); // sweep down

      chimeGain.gain.setValueAtTime(0.08 * intensity, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.masterGain);

      chimeOsc.start(now);
      chimeOsc.stop(now + 1.5);
    } catch {}
  }
}

export const cosmicAudio = new CosmicAudioEngine();
