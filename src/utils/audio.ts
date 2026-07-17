class GameAudio {
  private ctx: AudioContext | null = null;
  private enabled = false;

  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.enabled = true;
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.ctx || !this.enabled) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors during rapid plays
    }
  }

  playMatch(combo: number) {
    this.init();
    const baseFreq = 440; // A4
    const freq = baseFreq * Math.pow(1.059463094359, combo * 2); 
    // Dual oscillators for a richer, juicy retro pop feel
    this.playTone(freq, 'sine', 0.2, 0.15);
    this.playTone(freq * 1.5, 'sine', 0.15, 0.08); // fifth harmonic
    setTimeout(() => {
      this.playTone(freq * 2, 'triangle', 0.25, 0.1); // octave up
    }, 70);
  }

  playLevelComplete() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C major arpeggio
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.35, 0.12);
        this.playTone(freq * 1.003, 'triangle', 0.3, 0.08);
      }, i * 100);
    });
    // Final chord
    setTimeout(() => {
      this.playTone(1046.50, 'sine', 0.8, 0.1);
      this.playTone(1318.51, 'triangle', 0.8, 0.1);
      this.playTone(1567.98, 'sine', 0.8, 0.1);
    }, notes.length * 100);
  }

  playFeverActive() {
    this.init();
    // Fast ascending synth sweep for fever mode power-up
    const baseNotes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // E4, G4, C5, E5, G5, C6
    baseNotes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.15);
        this.playTone(freq * 1.005, 'triangle', 0.2, 0.1);
      }, i * 80);
    });
    // Sub bass and high chime drop at the peak
    setTimeout(() => {
      this.playTone(130.81, 'triangle', 0.8, 0.25); // Deep sub
      this.playTone(1567.98, 'sine', 0.6, 0.15); // High shimmer
    }, 450);
  }
  
  playGameOver() {
    this.init();
    const notes = [440, 415.3, 392, 349.23]; // Descending
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.8, 0.1), i * 300);
    });
  }
  
  playSwap() {
    this.init();
    this.playTone(300, 'triangle', 0.1, 0.1);
  }
  
  playClick() {
    this.init();
    this.playTone(600, 'square', 0.05, 0.05);
  }
  
  playError() {
    this.init();
    this.playTone(150, 'square', 0.2, 0.1);
  }

  playIceBreak() {
    this.init();
    this.playTone(1800, 'sine', 0.15, 0.12);
    setTimeout(() => {
      this.playTone(1400, 'triangle', 0.1, 0.08);
      this.playTone(2200, 'sine', 0.08, 0.06);
    }, 40);
  }

  private bossThemeInterval: any = null;
  private bossThemeStep = 0;

  startBossTheme() {
    this.init();
    if (this.bossThemeInterval) return;
    
    this.bossThemeStep = 0;
    const stepDuration = 200; // Fast driving 150 BPM feel
    
    // Dark Boss Bassline
    const bassline = [110.00, 110.00, 130.81, 110.00, 164.81, 110.00, 103.83, 130.81];
    // Dark high lead synth melody (A Minor)
    const melody = [
      440.00, 0, 493.88, 523.25, 0, 587.33, 523.25, 493.88,
      440.00, 440.00, 523.25, 659.25, 0, 587.33, 523.25, 493.88
    ];

    this.bossThemeInterval = setInterval(() => {
      if (!this.ctx || !this.enabled) return;
      
      const bassFreq = bassline[this.bossThemeStep % bassline.length];
      this.playTone(bassFreq, 'triangle', 0.18, 0.15);
      this.playTone(bassFreq * 2, 'sine', 0.12, 0.06); 
      
      const melFreq = melody[this.bossThemeStep % melody.length];
      if (melFreq > 0) {
        this.playTone(melFreq, 'sawtooth', 0.15, 0.04);
        this.playTone(melFreq * 1.5, 'sine', 0.1, 0.02); 
      }
      
      if (this.bossThemeStep % 2 === 1) {
        this.playTone(1200, 'square', 0.02, 0.015); 
      }
      if (this.bossThemeStep % 4 === 0) {
        this.playTone(220, 'triangle', 0.08, 0.06);
      }

      this.bossThemeStep++;
    }, stepDuration);
  }

  stopBossTheme() {
    if (this.bossThemeInterval) {
      clearInterval(this.bossThemeInterval);
      this.bossThemeInterval = null;
    }
  }
}

export const audio = new GameAudio();
