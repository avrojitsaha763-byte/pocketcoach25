/* ===================================================================
   SYSTEM FITNESS: STATE MANAGEMENT & RPG ENGINE
   Persistent LocalStorage, Rank-Up Logic, Shadow Army Roster
   =================================================================== */

const STORAGE_KEY = 'SOLO_SYSTEM_FITNESS_V1';

const DEFAULT_STATE = {
  hunter: {
    name: 'Avrojit Saha',
    title: 'The Awakened',
    jobClass: 'None (Trial Pending)',
    rank: 'E',
    level: 1,
    exp: 0,
    expMax: 100,
    hp: 100,
    hpMax: 100,
    mp: 100,
    mpMax: 100,
    gold: 250,
    unallocatedPoints: 5,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0]
  },
  stats: {
    str: 10,
    agi: 10,
    vit: 10,
    int: 10,
    per: 10
  },
  quests: [
    { id: 'pushups', name: 'Push-ups', target: 100, current: 0, unit: 'reps', icon: '??', stat: 'STR' },
    { id: 'situps', name: 'Sit-ups', target: 100, current: 0, unit: 'reps', icon: '??', stat: 'VIT' },
    { id: 'squats', name: 'Squats', target: 100, current: 0, unit: 'reps', icon: '??', stat: 'AGI' },
    { id: 'running', name: 'Running / Cardio', target: 10.0, current: 0.0, unit: 'km', icon: '??', stat: 'PER' }
  ],
  customQuests: [],
  shadowArmy: [
    { id: 'igris', name: 'Shadow Igris', origin: 'Defeated Procrastination', rank: 'Knight', buff: '+15% Strength', icon: '??' },
    { id: 'iron', name: 'Shadow Iron', origin: 'Conquered Leg Day Avoidance', rank: 'Elite', buff: '+20% Vitality', icon: '??' }
  ],
  skills: [
    { id: 'sprint', name: 'Sprint', type: 'active', desc: 'Increases movement speed and lowers perceived cardio fatigue by 30%.', unlocked: true, minLevel: 1 },
    { id: 'iron_body', name: 'Iron Will', type: 'passive', desc: 'Reduces muscular fatigue buildup and accelerates set recovery by 15%.', unlocked: true, minLevel: 3 },
    { id: 'stealth', name: 'Stealth Focus', type: 'active', desc: 'Blocks all mental distractions. Activates deep workout flow state.', unlocked: false, minLevel: 5 },
    { id: 'rulers_reach', name: 'Ruler\'s Authority', type: 'active', desc: 'Psychokinetic focus: Grants +25% burst output on max rep sets.', unlocked: false, minLevel: 10 },
    { id: 'monarch_domain', name: 'Monarch\'s Domain', type: 'passive', desc: 'Shadow soldiers fight at 150% combat efficiency. +50% Gold & XP multiplier.', unlocked: false, minLevel: 25 }
  ],
  nutrition: {
    caloriesConsumed: 0,
    calorieTarget: 2400,
    proteinGrams: 0,
    proteinTarget: 140,
    waterMl: 1250,
    waterTarget: 3000
  },
  inventory: [
    { id: 'lootbox_blessed', name: 'Blessed Random Box', qty: 2, icon: '??', desc: 'Contains rare recovery perks or artifact accessories.' },
    { id: 'elixir_recovery', name: 'Full Recovery Elixir', qty: 1, icon: '??', desc: 'Instantly restores full HP and resets workout fatigue.' }
  ],
  activeDungeon: null,
  penaltyModeActive: false
};

class SystemStateManager {
  constructor() {
    this.data = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Date check for daily quest reset
        const today = new Date().toISOString().split('T')[0];
        if (parsed.hunter.lastActiveDate !== today) {
          parsed.quests.forEach(q => q.current = 0);
          if (parsed.customQuests) parsed.customQuests.forEach(q => q.current = 0);
          parsed.hunter.lastActiveDate = today;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse state, using default:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notify();
    } catch (e) {
      console.error('Save state failed:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  // Add Experience & Calculate Rank Up
  addExp(amount) {
    this.data.hunter.exp += amount;
    let leveledUp = false;

    while (this.data.hunter.exp >= this.data.hunter.expMax) {
      this.data.hunter.exp -= this.data.hunter.expMax;
      this.data.hunter.level += 1;
      this.data.hunter.expMax = Math.round(this.data.hunter.expMax * 1.35);
      this.data.hunter.unallocatedPoints += 3;
      this.data.hunter.hp = this.data.hunter.hpMax = 100 + (this.data.hunter.level * 10);
      this.data.hunter.mp = this.data.hunter.mpMax = 100 + (this.data.hunter.level * 8);
      this.data.hunter.gold += 100 * this.data.hunter.level;
      leveledUp = true;
    }

    // Rank Calculation
    const lvl = this.data.hunter.level;
    let newRank = 'E';
    if (lvl >= 50) newRank = 'MONARCH';
    else if (lvl >= 35) newRank = 'S';
    else if (lvl >= 25) newRank = 'A';
    else if (lvl >= 15) newRank = 'B';
    else if (lvl >= 8) newRank = 'C';
    else if (lvl >= 4) newRank = 'D';

    this.data.hunter.rank = newRank;

    this.saveState();
    return { leveledUp, newLevel: this.data.hunter.level, newRank };
  }

  // Allocate Stat Points
  allocateStat(statKey) {
    if (this.data.hunter.unallocatedPoints > 0 && this.data.stats[statKey] !== undefined) {
      this.data.stats[statKey] += 1;
      this.data.hunter.unallocatedPoints -= 1;
      this.saveState();
      return true;
    }
    return false;
  }

  // Increment Quest Reps
  incrementQuest(questId, amount) {
    const q = this.data.quests.find(x => x.id === questId) || 
              (this.data.customQuests && this.data.customQuests.find(x => x.id === questId));
    if (q) {
      q.current = Math.min(q.target, +(q.current + amount).toFixed(1));
      
      // Award minor exp and gold per rep set
      this.data.hunter.gold += Math.round(amount * 2);
      this.saveState();

      // Check if all quests completed
      const allDone = this.data.quests.every(x => x.current >= x.target);
      if (allDone) {
        this.addExp(250);
      }
      return { current: q.current, target: q.target, allDone };
    }
    return null;
  }

  // Extract a new Shadow Soldier (Arise Ceremony)
  extractShadow(name, habit, buffType) {
    const shadow = {
      id: 'shadow_' + Date.now(),
      name: name || 'Shadow Guardian',
      origin: habit || 'Conquered Weakness',
      rank: this.data.hunter.rank,
      buff: buffType || '+10% All Attributes',
      icon: '??'
    };
    this.data.shadowArmy.unshift(shadow);
    this.addExp(300);
    this.saveState();
    return shadow;
  }

  // Log Hydration
  drinkWater(ml) {
    this.data.nutrition.waterMl = Math.min(6000, this.data.nutrition.waterMl + ml);
    this.saveState();
  }

  // Reset Progress
  resetAll() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }
}

window.systemState = new SystemStateManager();
