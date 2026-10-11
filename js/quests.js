/* ===================================================================
   QUESTS & PENALTY ENGINE
   =================================================================== */

class QuestEngine {
  constructor() {
    this.penaltyActive = false;
    this.penaltyTimeRemaining = 240; // 4 minutes
    this.penaltyInterval = null;
  }

  init() {
    this.startMidnightCountdown();
  }

  startMidnightCountdown() {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffSec = Math.floor((midnight - now) / 1000);

      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');

      const elem = document.getElementById('penaltyCountdown');
      if (elem) elem.innerText = `${hrs}:${mins}:${secs}`;
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  triggerPenaltyZone() {
    this.penaltyActive = true;
    if (window.systemAudio) window.systemAudio.playPenaltyAlert();
    const modal = document.getElementById('penaltyModal');
    if (modal) modal.style.display = 'flex';
  }

  startPenaltySurvival() {
    const timerElem = document.getElementById('penaltySurvivalTimer');
    this.penaltyTimeRemaining = 240;

    if (this.penaltyInterval) clearInterval(this.penaltyInterval);
    this.penaltyInterval = setInterval(() => {
      this.penaltyTimeRemaining--;
      const m = Math.floor(this.penaltyTimeRemaining / 60);
      const s = String(this.penaltyTimeRemaining % 60).padStart(2, '0');
      if (timerElem) timerElem.innerText = `${m}:${s}`;

      if (this.penaltyTimeRemaining <= 0) {
        clearInterval(this.penaltyInterval);
        this.clearPenaltyZone();
      }
    }, 1000);
  }

  clearPenaltyZone() {
    this.penaltyActive = false;
    const modal = document.getElementById('penaltyModal');
    if (modal) modal.style.display = 'none';
    if (window.systemAudio) window.systemAudio.playLevelUp();
    if (window.systemState) {
      window.systemState.addExp(500);
      alert('[SYSTEM] SURVIVAL DRILL COMPLETE! Penalty Zone Cleared. +500 EXP awarded!');
    }
  }
}

window.questEngine = new QuestEngine();
