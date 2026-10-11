/* ===================================================================
   EXTRAS: POTION ALCHEMY, BREATHING, LOOT BOX, CADENCE & ARCHITECT
   =================================================================== */

function addWater(amount) {
  if (window.systemState) {
    window.systemState.drinkWater(amount);
    if (window.systemAudio) window.systemAudio.playRep();
    renderAlchemy();
  }
}

function renderAlchemy() {
  if (!window.systemState) return;
  const n = window.systemState.data.nutrition;
  const pct = Math.min(100, Math.round((n.waterMl / n.waterTarget) * 100));
  
  const liquid = document.getElementById('potionLiquid');
  if (liquid) liquid.style.height = `${pct}%`;

  const label = document.getElementById('waterLabel');
  if (label) label.innerText = `${n.waterMl} / ${n.waterTarget} ml (${pct}%)`;
}

class BreathingSanctuary {
  constructor() {
    this.active = false;
    this.phase = 'idle';
    this.timer = null;
  }

  start() {
    this.active = true;
    if (window.systemAudio) window.systemAudio.startDrone();
    this.cycle();
  }

  stop() {
    this.active = false;
    if (this.timer) clearTimeout(this.timer);
    if (window.systemAudio) window.systemAudio.stopDrone();
    const circle = document.getElementById('breathCircle');
    const text = document.getElementById('breathText');
    if (circle) circle.className = 'breath-circle';
    if (text) text.innerText = 'START BREATHING';
  }

  cycle() {
    if (!this.active) return;
    const circle = document.getElementById('breathCircle');
    const text = document.getElementById('breathText');

    if (circle) circle.className = 'breath-circle inhale';
    if (text) text.innerText = 'INHALE (4s)';
    
    this.timer = setTimeout(() => {
      if (!this.active) return;
      if (circle) circle.className = 'breath-circle hold';
      if (text) text.innerText = 'HOLD (7s)';

      this.timer = setTimeout(() => {
        if (!this.active) return;
        if (circle) circle.className = 'breath-circle exhale';
        if (text) text.innerText = 'EXHALE (8s)';

        this.timer = setTimeout(() => {
          if (!this.active) return;
          this.cycle();
        }, 8000);
      }, 7000);
    }, 4000);
  }
}

window.sanctuary = new BreathingSanctuary();

function openLootBox() {
  if (window.systemAudio) window.systemAudio.playChime();
  const rewards = [
    { name: 'Full Recovery Elixir', desc: 'Instantly restores full HP and fatigue!', icon: '🧪' },
    { name: 'Knight Killer Dagger', desc: '+15% Push-up & Squat strike power!', icon: '🗡️' },
    { name: 'Orb of Avarice', desc: 'Doubles Gold rewards for 24 hours!', icon: '🔮' },
    { name: 'Demon Monarch Ring', desc: '+5 to STR, AGI, and VIT attributes!', icon: '💍' }
  ];
  const item = rewards[Math.floor(Math.random() * rewards.length)];

  if (window.systemState) {
    window.systemState.data.inventory.push({ ...item, id: 'item_' + Date.now(), qty: 1 });
    window.systemState.addExp(200);
    window.systemState.saveState();
  }

  alert(`[BLESSED RANDOM BOX UNBOXED!]\n\nYou discovered: ${item.icon} ${item.name}!\n${item.desc}\n+200 EXP Awarded.`);
  if (window.systemAudio) window.systemAudio.playLevelUp();
}

const ARCHITECT_DECREES = [
  '"Courage is not the absence of fear, but the mastery of physical discipline. Complete your daily set."',
  '"The System only rewards those who do not retreat. Every rep is a step toward the Monarch's throne."',
  '"Weakness is an illusion created by your resting heart rate. Break the threshold."',
  '"Your shadow army observes your efforts. Do not let your subordinates outwork you."'
];

function consultArchitect() {
  const quote = ARCHITECT_DECREES[Math.floor(Math.random() * ARCHITECT_DECREES.length)];
  const box = document.getElementById('architectQuote');
  if (box) box.innerText = quote;
  if (window.systemAudio) window.systemAudio.playChime();
}
