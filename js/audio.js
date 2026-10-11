/* ===================================================================
   SYSTEM FITNESS: WEB AUDIO API SYNTHESIZER
   Zero-dependency procedural sound effects engine
   =================================================================== */

class SystemAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.droneOsc = null;
    this.droneGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.droneGain) {
      this.stopDrone();
    }
    return this.muted;
  }

  // System Notification Chime (Crystal Hologram)
  playChime() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      
      gain.gain.setValueAtTime(0, now + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.5);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.5);
    });
  }

  // Level Up Fanfare
  playLevelUp() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      
      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.6);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.65);
    });
  }

  // Rep Count Hit
  playRep() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Penalty Klaxon
  playPenaltyAlert() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.4);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Arise Sub-Bass Extraction
  playArise() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 1.2);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.4);
  }

  // Boss Critical Strike
  playBossHit() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.15);
    
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // 432Hz Binaural Meditation Drone
  startDrone() {
    if (this.muted) return;
    this.init();
    if (this.droneOsc) this.stopDrone();
    
    this.droneOsc = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.setValueAtTime(432, this.ctx.currentTime);
    
    this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.droneGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1.5);
    
    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.ctx.destination);
    this.droneOsc.start();
  }

  stopDrone() {
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        try {
          if (this.droneOsc) {
            this.droneOsc.stop();
            this.droneOsc.disconnect();
            this.droneOsc = null;
          }
        } catch (e) {}
      }, 500);
    }
  }
}

window.systemAudio = new SystemAudioEngine();
