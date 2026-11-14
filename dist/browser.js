"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ===== browser.ts =====
const squads_1 = require("./squads");
const predict_1 = require("./predict");
const POSITIONS = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'DM', 'RW', 'AM', 'LW', 'ST'];
const STYLES = ['possession', 'counter', 'high_press', 'low_block', 'wing_play', 'direct'];
let homeId = 'gs';
let awayId = 'fb';
function renderTeamSelector() {
    const ids = Object.keys(squads_1.TEAMS);
    const homeSel = document.getElementById('home-select');
    const awaySel = document.getElementById('away-select');
    const opts = ids.map(id => `<option value="${id}">${squads_1.TEAMS[id].name}</option>`).join('');
    homeSel.innerHTML = opts;
    awaySel.innerHTML = opts;
    homeSel.value = homeId;
    awaySel.value = awayId;
    homeSel.onchange = () => { homeId = homeSel.value; if (homeId === awayId) {
        awayId = ids.find(i => i !== homeId);
        awaySel.value = awayId;
    } renderAll(); };
    awaySel.onchange = () => { awayId = awaySel.value; if (homeId === awayId) {
        homeId = ids.find(i => i !== awayId);
        homeSel.value = homeId;
    } renderAll(); };
}
function renderPanel(team, panelId, isHome) {
    const panel = document.getElementById(panelId);
    panel.innerHTML = `<h2>${team.name} ${isHome ? '(Ev)' : '(Dep)'}</h2>
    <div class="section"><div class="section-title">İlk 11</div>
    ${team.startingXI.map((id, i) => {
        const p = team.players.find(x => x.id === id);
        const used = new Set(team.startingXI.filter((_, j) => j !== i));
        return `<div class="player-slot">${POSITIONS[i]}<select data-team="${team.id}" data-idx="${i}">
        ${team.players.filter(pl => !used.has(pl.id)).map(pl => `<option value="${pl.id}" ${pl.id === id ? 'selected' : ''}>${pl.name} (${pl.position})</option>`).join('')}
      </select></div>`;
    }).join('')}
    </div>
    <div class="section"><div class="section-title">Taktik</div>
    <div class="tactics">
      <label>Stil<select id="style-${team.id}">
        ${STYLES.map(s => `<option value="${s}" ${team.tactics.style === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select></label>
    </div></div>`;
    panel.querySelectorAll('select[data-team]').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const idx = parseInt(sel.dataset.idx);
            squads_1.TEAMS[team.id].startingXI[idx] = e.target.value;
            renderPanel(team, panelId, isHome);
        });
    });
    const styleSel = document.getElementById(`style-${team.id}`);
    styleSel?.addEventListener('change', () => { squads_1.TEAMS[team.id].tactics.style = styleSel.value; });
}
function renderAll() {
    const home = squads_1.TEAMS[homeId], away = squads_1.TEAMS[awayId];
    renderPanel(home, 'home-panel', true);
    renderPanel(away, 'away-panel', false);
    document.getElementById('vs-label').textContent = `${home.name} vs ${away.name}`;
    document.getElementById('result').style.display = 'none';
}
document.getElementById('sim-btn').addEventListener('click', () => {
    const btn = document.getElementById('sim-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Hesaplanıyor...';
    setTimeout(() => {
        const home = squads_1.TEAMS[homeId], away = squads_1.TEAMS[awayId];
        const p = (0, predict_1.predictMatch)(home, away, 10000);
        const r = document.getElementById('result');
        r.style.display = 'block';
        r.innerHTML = `<h2>${home.name} vs ${away.name} — Sonuç</h2>
      <div class="odds-grid">
        <div class="odds-cell"><div class="label">${home.name}</div><div class="value">${p.odds.home}</div><div class="pct">%${p.homeWinPct}</div></div>
        <div class="odds-cell"><div class="label">Beraberlik</div><div class="value">${p.odds.draw}</div><div class="pct">%${p.drawPct}</div></div>
        <div class="odds-cell"><div class="label">${away.name}</div><div class="value">${p.odds.away}</div><div class="pct">%${p.awayWinPct}</div></div>
      </div>
      <p>En Olası: <b>${p.mostLikelyScore}</b> · Ort. Gol: ${p.avgGoals} · 2.5 Üst: %${p.over25Pct} · KG: %${p.bttsPct}</p>
      <div class="score-list">${Object.entries(p.scoreDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, v]) => `<div class="score-item"><div class="score">${s}</div>%${v}</div>`).join('')}</div>`;
        btn.disabled = false;
        btn.textContent = '🎲 SİMÜLE ET (10.000)';
    }, 10);
});
renderTeamSelector();
renderAll();
