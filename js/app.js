/* ===================================================================
   SYSTEM FITNESS: MASTER APP CONTROLLER & UI BINDINGS
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Bind tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Sound toggle button
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isMuted = window.systemAudio.toggleMute();
      soundBtn.innerText = isMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
      soundBtn.style.borderColor = isMuted ? '#ff0055' : 'var(--system-cyan)';
    });
  }

  // Subscribe to state updates
  if (window.systemState) {
    window.systemState.subscribe(() => {
      renderAll();
    });
  }

  // Initial renders
  renderAll();
  initRadarChart();
  if (window.questEngine) window.questEngine.init();
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.style.display = (sec.id === `tab-${tabId}`) ? 'block' : 'none';
  });

  if (window.systemAudio) window.systemAudio.playChime();

  // If opening camera tab, start camera
  if (tabId === 'camera' && window.aiCamera) {
    window.aiCamera.init('webcamVideo', 'webcamCanvas');
    window.aiCamera.start('pushups');
  } else if (window.aiCamera && window.aiCamera.active) {
    window.aiCamera.stop();
  }

  // If leaving sanctuary, stop drone
  if (tabId !== 'sanctuary' && window.sanctuary && window.sanctuary.active) {
    window.sanctuary.stop();
  }
}

function renderAll() {
  renderStatus();
  renderQuests();
  renderDungeons();
  renderShadows();
  renderSkills();
  if (window.renderAlchemy) renderAlchemy();
  updateRadarData();
}

/* -------------------------------------------------------------
   RENDER STATUS SCREEN
------------------------------------------------------------- */
function renderStatus() {
  if (!window.systemState) return;
  const s = window.systemState.data;

  // Hunter Info
  const nameElem = document.getElementById('hunterName');
  if (nameElem) nameElem.innerText = s.hunter.name;

  const titleElem = document.getElementById('hunterTitle');
  if (titleElem) titleElem.innerText = s.hunter.title;

  const rankBadge = document.getElementById('hunterRankBadge');
  if (rankBadge) {
    rankBadge.innerText = `${s.hunter.rank}-RANK HUNTER`;
    rankBadge.className = `badge-rank rank-${s.hunter.rank}`;
  }

  const lvlElem = document.getElementById('hunterLevel');
  if (lvlElem) lvlElem.innerText = `LVL ${s.hunter.level}`;

  // Gauges
  const hpPct = Math.round((s.hunter.hp / s.hunter.hpMax) * 100);
  const hpFill = document.getElementById('hpBarFill');
  if (hpFill) hpFill.style.width = `${hpPct}%`;
  const hpText = document.getElementById('hpBarText');
  if (hpText) hpText.innerText = `${s.hunter.hp} / ${s.hunter.hpMax}`;

  const mpPct = Math.round((s.hunter.mp / s.hunter.mpMax) * 100);
  const mpFill = document.getElementById('mpBarFill');
  if (mpFill) mpFill.style.width = `${mpPct}%`;
  const mpText = document.getElementById('mpBarText');
  if (mpText) mpText.innerText = `${s.hunter.mp} / ${s.hunter.mpMax}`;

  const xpPct = Math.round((s.hunter.exp / s.hunter.expMax) * 100);
  const xpFill = document.getElementById('xpBarFill');
  if (xpFill) xpFill.style.width = `${xpPct}%`;
  const xpText = document.getElementById('xpBarText');
  if (xpText) xpText.innerText = `${s.hunter.exp} / ${s.hunter.expMax} XP (${xpPct}%)`;

  // Gold & Unallocated
  const goldElem = document.getElementById('hunterGold');
  if (goldElem) goldElem.innerText = `${s.hunter.gold} G`;

  const unallocBadge = document.getElementById('unallocatedBadge');
  if (unallocBadge) {
    unallocBadge.innerText = `+${s.hunter.unallocatedPoints} ATTRIBUTE POINTS AVAILABLE`;
    unallocBadge.style.display = s.hunter.unallocatedPoints > 0 ? 'inline-flex' : 'none';
  }

  // Attributes
  ['str', 'agi', 'vit', 'int', 'per'].forEach(k => {
    const vElem = document.getElementById(`statVal-${k}`);
    if (vElem) vElem.innerText = s.stats[k];

    const btn = document.getElementById(`btnStat-${k}`);
    if (btn) btn.disabled = s.hunter.unallocatedPoints <= 0;
  });
}

function allocatePoint(statKey) {
  if (window.systemState && window.systemState.allocateStat(statKey)) {
    if (window.systemAudio) window.systemAudio.playRep();
    renderStatus();
    updateRadarData();
  }
}

/* -------------------------------------------------------------
   RADAR ATTRIBUTES CHART (CANVAS)
------------------------------------------------------------- */
let radarChart = null;
function initRadarChart() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  drawRadar();
}

function updateRadarData() {
  drawRadar();
}

function drawRadar() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas || !window.systemState) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = 280;
  const h = canvas.height = 280;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 100;

  ctx.clearRect(0, 0, w, h);

  const stats = window.systemState.data.stats;
  const keys = ['str', 'agi', 'vit', 'int', 'per'];
  const labels = ['STR', 'AGI', 'VIT', 'INT', 'PER'];
  const totalSides = keys.length;
  const maxStatVal = Math.max(30, ...keys.map(k => stats[k]));

  // Draw background web polygons
  for (let step = 0.25; step <= 1.0; step += 0.25) {
    ctx.beginPath();
    for (let i = 0; i < totalSides; i++) {
      const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius * step;
      const y = cy + Math.sin(angle) * radius * step;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw Stat Polygon
  ctx.beginPath();
  keys.forEach((k, i) => {
    const val = stats[k];
    const r = (val / maxStatVal) * radius;
    const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
  ctx.fill();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw Labels
  ctx.font = 'bold 11px Orbitron, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  keys.forEach((k, i) => {
    const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
    const lx = cx + Math.cos(angle) * (radius + 20);
    const ly = cy + Math.sin(angle) * (radius + 20);
    ctx.fillText(labels[i], lx, ly);
  });
}

/* -------------------------------------------------------------
   RENDER QUESTS
------------------------------------------------------------- */
function renderQuests() {
  if (!window.systemState) return;
  const grid = document.getElementById('questsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  window.systemState.data.quests.forEach(q => {
    const pct = Math.min(100, Math.round((q.current / q.target) * 100));
    const isDone = q.current >= q.target;

    const card = document.createElement('div');
    card.className = `quest-item-card holo-panel ${isDone ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="quest-card-top">
        <span class="quest-exercise-name">${q.icon} ${q.name}</span>
        <span class="quest-badge-tag">${q.stat} +EXP</span>
      </div>
      <div class="quest-progress-numbers">
        <span class="quest-current-rep">${q.current}</span>
        <span class="quest-target-rep">/ ${q.target} ${q.unit}</span>
      </div>
      <div class="gauge-bar-track">
        <div class="gauge-bar-fill fill-hp" style="width: ${pct}%"></div>
      </div>
      <div class="rep-buttons-row">
        <button class="btn-rep" onclick="addReps('${q.id}', 5)">+5</button>
        <button class="btn-rep" onclick="addReps('${q.id}', 10)">+10</button>
        <button class="btn-rep" onclick="addReps('${q.id}', 25)">+25</button>
        <button class="btn-rep" onclick="completeQuest('${q.id}')">MAX</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function addReps(questId, amount) {
  if (window.systemState) {
    const res = window.systemState.incrementQuest(questId, amount);
    if (window.systemAudio) window.systemAudio.playRep();
    renderQuests();
    renderStatus();
    if (res && res.allDone) {
      if (window.systemAudio) window.systemAudio.playLevelUp();
      alert('[SYSTEM] DAILY QUEST COMPLETED! Status Recovery applied. +250 EXP awarded.');
    }
  }
}

function completeQuest(questId) {
  const q = window.systemState.data.quests.find(x => x.id === questId);
  if (q) {
    addReps(questId, q.target - q.current);
  }
}

/* -------------------------------------------------------------
   RENDER DUNGEON GATES
------------------------------------------------------------- */
function renderDungeons() {
  const grid = document.getElementById('dungeonGrid');
  if (!grid || !window.dungeonManager) return;

  grid.innerHTML = '';
  window.dungeonManager.dungeons.forEach(g => {
    const card = document.createElement('div');
    card.className = `gate-card holo-panel ${g.rank === 'S' || g.rank === 'A' ? 'red-gate' : ''}`;
    card.innerHTML = `
      <div class="gate-top-info">
        <span class="gate-rank-badge rank-${g.rank}">${g.rank}-RANK GATE</span>
        <span style="font-size: 0.8rem; color: #ffd700;">★ ${g.exp} EXP</span>
      </div>
      <div>
        <h3 class="gate-boss-title">${g.boss}</h3>
        <p class="gate-boss-desc">${g.desc}</p>
      </div>
      <div class="boss-hp-container">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
          <span>HP POOL</span>
          <span>${g.curHp} / ${g.maxHp}</span>
        </div>
        <div class="boss-hp-bar">
          <div class="boss-hp-fill" style="width: ${Math.round((g.curHp/g.maxHp)*100)}%"></div>
        </div>
      </div>
      <button class="btn-system ${g.rank === 'S' ? 'btn-penalty' : ''}" onclick="startBossRaid('${g.id}')">
        ⚔️ ENTER GATE RAID
      </button>
    `;
    grid.appendChild(card);
  });
}

function startBossRaid(gateId) {
  const gate = window.dungeonManager.enterGate(gateId);
  if (!gate) return;

  const arena = document.getElementById('bossArenaSection');
  if (arena) {
    arena.style.display = 'block';
    arena.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('arenaBossName').innerText = gate.boss;
    document.getElementById('arenaGateRank').innerText = `${gate.rank}-RANK GATE`;
    updateArenaCombatView(gate.curHp, gate.maxHp, window.dungeonManager.combatLogs);
  }
}

function attackBoss(type) {
  if (!window.dungeonManager) return;
  const res = window.dungeonManager.attackBoss(type, 10);
  if (res) {
    updateArenaCombatView(res.curHp, res.maxHp, res.logs);
    renderDungeons();
    renderStatus();
  }
}

function updateArenaCombatView(cur, max, logs) {
  const hpFill = document.getElementById('arenaBossHpFill');
  const hpText = document.getElementById('arenaBossHpText');
  const logBox = document.getElementById('arenaCombatLog');

  if (hpFill) hpFill.style.width = `${Math.round((cur/max)*100)}%`;
  if (hpText) hpText.innerText = `${cur} / ${max} HP`;

  if (logBox && logs) {
    logBox.innerHTML = logs.map(l => `<div>${l}</div>`).join('');
  }
}

/* -------------------------------------------------------------
   RENDER SHADOW ARMY
------------------------------------------------------------- */
function renderShadows() {
  if (!window.systemState) return;
  const grid = document.getElementById('shadowArmyGrid');
  if (!grid) return;

  grid.innerHTML = '';
  window.systemState.data.shadowArmy.forEach(s => {
    const card = document.createElement('div');
    card.className = 'shadow-card holo-panel';
    card.innerHTML = `
      <div class="shadow-rank-tag">🔮 ${s.rank.toUpperCase()} SOLDIER</div>
      <div class="shadow-name">${s.icon} ${s.name}</div>
      <div class="shadow-origin">Origin: "${s.origin}"</div>
      <div class="shadow-buff-box">
        <span>⚡ Passive:</span>
        <strong>${s.buff}</strong>
      </div>
    `;
    grid.appendChild(card);
  });

  const countElem = document.getElementById('shadowCountBadge');
  if (countElem) countElem.innerText = `${window.systemState.data.shadowArmy.length} EXTRACTED`;
}

/* -------------------------------------------------------------
   RENDER SKILLS
------------------------------------------------------------- */
function renderSkills() {
  if (!window.systemState) return;
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  window.systemState.data.skills.forEach(sk => {
    const canUnlock = window.systemState.data.hunter.level >= sk.minLevel;
    const card = document.createElement('div');
    card.className = `skill-card holo-panel ${sk.unlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      <div class="skill-top-bar">
        <span class="skill-type-badge skill-type-${sk.type}">${sk.type.toUpperCase()}</span>
        <span style="font-size: 0.72rem; color: #a78bfa;">REQ: LVL ${sk.minLevel}</span>
      </div>
      <div class="skill-title">${sk.name}</div>
      <div class="skill-desc">${sk.desc}</div>
      <button class="btn-system" style="margin-top:auto;" ${sk.unlocked ? 'disabled' : ''} onclick="unlockSkill('${sk.id}')">
        ${sk.unlocked ? '✓ UNLOCKED' : (canUnlock ? '🔮 UNLOCK' : '🔒 LOCKED')}
      </button>
    `;
    grid.appendChild(card);
  });
}

function unlockSkill(skillId) {
  const sk = window.systemState.data.skills.find(x => x.id === skillId);
  if (sk && !sk.unlocked) {
    sk.unlocked = true;
    if (window.systemAudio) window.systemAudio.playLevelUp();
    window.systemState.saveState();
    renderSkills();
  }
}
