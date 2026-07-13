/**
 * Synthesizes chess sound effects using the Web Audio API.
 * This runs completely client-side with no audio files needed.
 */
class ChessSoundSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playMove() {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime); // Standard solid thud freq
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCapture() {
    this.init();
    if (!this.ctx) return;

    // Percussive dry snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playCheck() {
    this.init();
    if (!this.ctx) return;

    // Double high-pitch warning
    const now = this.ctx.currentTime;
    [0, 0.08].forEach((delay) => {
      const osc = this.ctx?.createOscillator();
      const gain = this.ctx?.createGain();
      if (!osc || !gain) return;

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now + delay);
      gain.gain.setValueAtTime(0.06, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);

      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    });
  }

  playMate() {
    this.init();
    if (!this.ctx) return;

    // Majestic descending win/loss chord
    const now = this.ctx.currentTime;
    const notes = [523.25, 392.00, 329.63, 261.63]; // C5, G4, E4, C4
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx?.createOscillator();
      const gain = this.ctx?.createGain();
      if (!osc || !gain) return;

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.07, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.4);
    });
  }
}

export const sounds = new ChessSoundSynth();
