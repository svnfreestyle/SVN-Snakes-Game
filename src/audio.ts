/**
 * 8-Bit Web Audio Synthesizer for Nokia Snake
 * Generates authentic retro monophonic buzzer tones without external audio assets.
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    const saved = localStorage.getItem('svn_snake_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('svn_snake_muted', String(muted));
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Play a clean tone with ADSR envelope
   */
  public playTone(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.15) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, this.ctx.currentTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // AudioContext policy handled gracefully
    }
  }

  /**
   * Classic Nokia food blip
   */
  public playEat() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // ignore
    }
  }

  /**
   * Nokia Snake II Bonus creature capture (multi-tone arpeggio)
   */
  public playBonus() {
    if (this.isMuted) return;
    const notes = [659, 880, 1046, 1318]; // E5, A5, C6, E6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 'square', 0.2);
      }, idx * 55);
    });
  }

  /**
   * Bonus creature appeared
   */
  public playBonusSpawn() {
    if (this.isMuted) return;
    this.playTone(523.25, 0.05, 'square', 0.12);
    setTimeout(() => {
      this.playTone(659.25, 0.05, 'square', 0.12);
    }, 60);
  }

  /**
   * Subtle tick on steer
   */
  public playTurn() {
    if (this.isMuted) return;
    this.playTone(330, 0.02, 'triangle', 0.06);
  }

  /**
   * Tactile phone keypad click
   */
  public playKeyClick() {
    if (this.isMuted) return;
    this.playTone(450, 0.025, 'triangle', 0.1);
  }

  /**
   * Snake death impact crunch
   */
  public playHit() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.32);
    } catch {
      // ignore
    }
  }

  /**
   * Classic Nokia game over descending sequence
   */
  public playGameOver() {
    if (this.isMuted) return;
    const notes = [392, 349, 311, 261]; // G4, F4, D#4, C4
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.14, 'square', 0.2);
      }, idx * 120);
    });
  }

  /**
   * Level Up ascending progression chime
   */
  public playLevelUp() {
    if (this.isMuted) return;
    const notes = [587, 740, 880, 1175]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 'square', 0.22);
      }, idx * 60);
    });
  }

  /**
   * New High Score Fanfare
   */
  public playHighscore() {
    if (this.isMuted) return;
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, idx === notes.length - 1 ? 0.3 : 0.09, 'square', 0.22);
      }, idx * 90);
    });
  }
}

export const sound = new RetroAudioEngine();
