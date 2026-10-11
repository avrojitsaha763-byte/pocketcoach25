/* ===================================================================
   DUNGEON GATES & BOSS RAID COMBAT SYSTEM
   =================================================================== */

const DUNGEON_ROSTER = [
  { id: 'gate_e', name: 'Goblin Scout Den', rank: 'E', boss: 'Goblin Chieftain', maxHp: 600, curHp: 600, exp: 200, gold: 150, desc: 'A low-rank outbreak in the subway tunnels. Defeat the scouts!' },
  { id: 'gate_d', name: 'Desert Arachnid Lair', rank: 'D', boss: 'Poison Centipede', maxHp: 1500, curHp: 1500, exp: 450, gold: 350, desc: 'Swarming sand monsters. Requires endurance calisthenics!' },
  { id: 'gate_c', name: 'Gate of Cerberus', rank: 'C', boss: 'Hell Hound Keeper', maxHp: 3200, curHp: 3200, exp: 900, gold: 800, desc: 'Guardian of the Demon Castle. High intensity burn required!' },
  { id: 'gate_b', name: 'Demon Castle Spire', rank: 'B', boss: 'Demon King Baran', maxHp: 6500, curHp: 6500, exp: 2000, gold: 2000, desc: 'Towering lightning lords. Massive strength volume required!' },
  { id: 'gate_a', name: 'High Orc Citadel', rank: 'A', boss: 'Kargalgan the Shaman', maxHp: 12000, curHp: 12000, exp: 4500, gold: 5000, desc: 'Red gate territory. Only elite hunters survive!' },
  { id: 'gate_s', name: 'Monarch Red Gate', rank: 'S', boss: 'Frost Sovereign', maxHp: 25000, curHp: 25000, exp: 12000, gold: 15000, desc: 'S-Rank calamity gate. True Monarch awakening trial!' }
];

class DungeonRaidManager {
  constructor() {
    this.dungeons = JSON.parse(JSON.stringify(DUNGEON_ROSTER));
    this.currentGate = null;
    this.combatLogs = [];
  }

  enterGate(gateId) {
    this.currentGate = this.dungeons.find(g => g.id === gateId);
    if (!this.currentGate) return null;
    this.combatLogs = [[SYSTEM] Hunter entered !, [WARNING] Boss  has appeared!];
    if (window.systemAudio) window.systemAudio.playChime();
    return this.currentGate;
  }

  attackBoss(attackType = 'pushup', count = 10) {
    if (!this.currentGate || this.currentGate.curHp <= 0) return null;

    const str = window.systemState ? window.systemState.data.stats.str : 10;
    const per = window.systemState ? window.systemState.data.stats.per : 10;
    
    // Damage calculation based on hunter stats
    let baseDmg = attackType === 'pushup' ? 30 : (attackType === 'squat' ? 40 : 80);
    let isCrit = Math.random() * 100 < (per * 1.5);
    let critMultiplier = isCrit ? 2.2 : 1.0;
    let totalDmg = Math.round(count * baseDmg * (1 + str * 0.05) * critMultiplier);

    this.currentGate.curHp = Math.max(0, this.currentGate.curHp - totalDmg);

    if (window.systemAudio) {
      if (isCrit) window.systemAudio.playBossHit();
      else window.systemAudio.playRep();
    }

    const logEntry = isCrit 
      ? ?? CRITICAL HIT! x  dealt  DMG!
      : ?? Strike landed! x  dealt  DMG!;

    this.combatLogs.unshift(logEntry);
    if (this.combatLogs.length > 8) this.combatLogs.pop();

    let cleared = false;
    if (this.currentGate.curHp <= 0) {
      cleared = true;
      this.combatLogs.unshift(? BOSS SLAIN! Gate cleared! + EXP, + GOLD!);
      if (window.systemAudio) window.systemAudio.playLevelUp();
      if (window.systemState) {
        window.systemState.addExp(this.currentGate.exp);
        window.systemState.data.hunter.gold += this.currentGate.gold;
        window.systemState.saveState();
      }
    }

    return {
      curHp: this.currentGate.curHp,
      maxHp: this.currentGate.maxHp,
      totalDmg,
      isCrit,
      cleared,
      logs: this.combatLogs
    };
  }
}

window.dungeonManager = new DungeonRaidManager();
