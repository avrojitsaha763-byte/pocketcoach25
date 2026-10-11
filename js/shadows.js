/* ===================================================================
   SHADOW ARMY & 'ARISE' CEREMONY
   =================================================================== */

class ShadowArmyManager {
  openAriseModal() {
    const modal = document.getElementById('ariseModal');
    if (modal) modal.classList.add('active');
  }

  closeAriseModal() {
    const modal = document.getElementById('ariseModal');
    if (modal) modal.classList.remove('active');
  }

  executeArise(habitText, shadowName) {
    if (!habitText) habitText = 'Conquered Sloth';
    if (!shadowName) shadowName = 'Shadow Sovereign';

    if (window.systemAudio) window.systemAudio.playArise();

    document.body.style.boxShadow = 'inset 0 0 100px rgba(157, 78, 221, 0.8)';
    setTimeout(() => {
      document.body.style.boxShadow = 'none';
    }, 1200);

    const buffs = ['+15% Strength', '+20% Vitality', '+25% Agility', '+30% Focus/Mana', '+10% All Stats'];
    const chosenBuff = buffs[Math.floor(Math.random() * buffs.length)];

    if (window.systemState) {
      const soldier = window.systemState.extractShadow(shadowName, habitText, chosenBuff);
      this.closeAriseModal();
      if (window.renderShadows) window.renderShadows();
      if (window.renderStatus) window.renderStatus();
      alert(`[SYSTEM] EXTRACTION SUCCESSFUL!\nShadow Soldier: ${soldier.name}\nBuff: ${soldier.buff}`);
    }
  }
}

window.shadowManager = new ShadowArmyManager();
