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
    // Pitch increases with combo
    const baseFreq = 440; // A4
    const freq = baseFreq * Math.pow(1.059463094359, combo * 2); 
    this.playTone(freq, 'sine', 0.3, 0.2);
    setTimeout(() => this.playTone(freq * 1.25, 'sine', 0.4, 0.2), 100);
  }

  playLevelComplete() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.5, 0.1), i * 150);
    });
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
  
  playError() {
    this.init();
    this.playTone(150, 'square', 0.2, 0.1);
  }
}

export const audio = new GameAudio();
