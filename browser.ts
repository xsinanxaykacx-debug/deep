// ===== browser.ts =====
import { TEAMS } from './squads';
import { predictMatch } from './predict';
import type { Team } from './core';

const POSITIONS = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'DM', 'RW', 'AM', 'LW', 'ST'];
const STYLES = ['possession', 'counter', 'high_press', 'low_block', 'wing_play', 'direct'];
const STYLE_LABELS: Record<string, string> = {
  possession: 'Tiki-Taka', counter: 'Kontra Atak', high_press: 'Yüksek Pres',
  low_block: 'Derin Savunma', wing_play: 'Kanat Oyunu', direct: 'Uzun Top'
};

let homeId = 'gs';
let awayId = 'fb';

function renderTeamSelector() {
  const ids = Object.keys(TEAMS);
  const homeSel = document.getElementById('home-select') as HTMLSelectElement;
  const awaySel = document.getElementById('away-select') as HTMLSelectElement;
  const opts = ids.map(id => `<option value="${id}">${TEAMS[id].name}</option>`).join('');
  homeSel.innerHTML = opts; awaySel.innerHTML = opts;
  homeSel.value = homeId; awaySel.value = awayId;
  
  homeSel.onchange = () => { homeId = homeSel.value; if (homeId === awayId) { awayId = ids.find(i => i !== homeId)!; awaySel.value = awayId; } renderAll(); };
  awaySel.onchange = () => { awayId = awaySel.value; if (homeId === awayId) { homeId = ids.find(i => i !== awayId)!; homeSel.value = homeId; } renderAll(); };
}

function renderPanel(team: Team, panelId: string, isHome: boolean) {
  const panel = document.getElementById(panelId)!;
  panel.innerHTML = `<h2>${team.name} ${isHome ? '(Ev)' : '(Dep)'}</h2>
    <div class="section"><div class="section-title">İlk 11</div>
    ${team.startingXI.map((id, i) => {
      const used = new Set(team.startingXI.filter((_, j) => j !== i));
      return `<div class="player-slot">${POSITIONS[i]}<select data-team="${team.id}" data-idx="${i}">
        ${team.players.filter(pl => !used.has(pl.id)).map(pl => `<option value="${pl.id}" ${pl.id === id ? 'selected' : ''}>${pl.name} (${pl.position})</option>`).join('')}
      </select></div>`;
    }).join('')}
    </div>
    <div class="section"><div class="section-title">Taktik</div>
    <div class="tactics"><label>Stil<select id="style-${team.id}">
        ${STYLES.map(s => `<option value="${s}" ${team.tactics.style === s ? 'selected' : ''}>${STYLE_LABELS[s]}</option>`).join('')}
    </select></label></div></div>`;
    
  panel.querySelectorAll('select[data-team]').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt((sel as HTMLElement).dataset.idx!);
      TEAMS[team.id].startingXI[idx] = (e.target as HTMLSelectElement).value;
      renderPanel(team, panelId, isHome);
    });
  });
  
  const styleSel = document.getElementById(`style-${team.id}`) as HTMLSelectElement;
  styleSel?.addEventListener('change', () => { TEAMS[team.id].tactics.style = styleSel.value as any; });
}

function renderAll() {
  const home = TEAMS[homeId], away = TEAMS[awayId];
  renderPanel(home, 'home-panel', true); renderPanel(away, 'away-panel', false);
  document.getElementById('vs-label')!.textContent = `${home.name} vs ${away.name}`;
  document.getElementById('result')!.style.display = 'none';
}

document.getElementById('sim-btn')!.addEventListener('click', () => {
  const btn = document.getElementById('sim-btn') as HTMLButtonElement;
  btn.disabled = true; 
  btn.textContent = '⏳ Hesaplanıyor...';
  
  setTimeout(() => {
    try {
      const home = TEAMS[homeId], away = TEAMS[awayId];
      const p = predictMatch(home, away, 10000);
      const r = document.getElementById('result')!;
      r.style.display = 'block';
      
      const fmt = (val: number) => (isFinite(val) && !isNaN(val) ? val : 0);

      r.innerHTML = `<h2>${home.name} vs ${away.name} — Sonuç</h2>
        <div class="odds-grid">
          <div class="odds-cell"><div class="label">${home.name}</div><div class="value">${fmt(p.odds.home)}</div><div class="pct">%${fmt(p.homeWinPct)}</div></div>
          <div class="odds-cell"><div class="label">Beraberlik</div><div class="value">${fmt(p.odds.draw)}</div><div class="pct">%${fmt(p.drawPct)}</div></div>
          <div class="odds-cell"><div class="label">${away.name}</div><div class="value">${fmt(p.odds.away)}</div><div class="pct">%${fmt(p.awayWinPct)}</div></div>
        </div>
        <p>En Olası: <b>${p.mostLikelyScore}</b> · Ort. Gol: ${fmt(p.avgGoals)} · 2.5 Üst: %${fmt(p.over25Pct)} · KG: %${fmt(p.bttsPct)}</p>
        <div class="score-list">${Object.entries(p.scoreDistribution).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([s,v]) => `<div class="score-item"><div class="score">${s}</div>%${fmt(v)}</div>`).join('')}</div>`;
    } catch (err) {
      alert("Simülasyon Hatası: " + err);
      console.error(err);
    } finally {
      btn.disabled = false; 
      btn.textContent = '🎲 SİMÜLE ET (10.000)';
    }
  }, 10);
});

renderTeamSelector();
renderAll();