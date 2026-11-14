// ===== browser.ts =====
import { TEAMS } from './squads';
import { predictMatch, setTactics } from './predict';
import { FORMATION_NAMES, buildFormationSlots } from './core';
import type { Team, TacticStyle } from './core';

const STYLES: TacticStyle[] = [
  'possession', 'counter', 'high_press', 'low_block', 'wing_play', 'direct'
];
const STYLE_LABELS: Record<TacticStyle, string> = {
  possession: 'Topa Sahip Olma',
  counter: 'Kontra Atak',
  high_press: 'Yüksek Pres',
  low_block: 'Derin Savunma',
  wing_play: 'Kanat Oyunu',
  direct: 'Direkt Oyun'
};
const TACTICS: { key: 'width' | 'depth' | 'pressing' | 'tempo' | 'passingRange'; label: string }[] = [
  { key: 'width', label: 'Genişlik' },
  { key: 'depth', label: 'Savunma Hattı' },
  { key: 'pressing', label: 'Pres' },
  { key: 'tempo', label: 'Tempo' },
  { key: 'passingRange', label: 'Pas Mesafesi' }
];

let homeId = 'gs';
let awayId = 'fb';

function renderTeamSelector(): void {
  const ids = Object.keys(TEAMS);
  const homeSel = document.getElementById('home-select') as HTMLSelectElement;
  const awaySel = document.getElementById('away-select') as HTMLSelectElement;
  const opts = ids.map(id => `<option value="${id}">${TEAMS[id].name}</option>`).join('');
  homeSel.innerHTML = opts;
  awaySel.innerHTML = opts;
  homeSel.value = homeId;
  awaySel.value = awayId;

  homeSel.onchange = () => {
    homeId = homeSel.value;
    if (homeId === awayId) {
      awayId = ids.find(id => id !== homeId)!;
      awaySel.value = awayId;
    }
    renderAll();
  };
  awaySel.onchange = () => {
    awayId = awaySel.value;
    if (homeId === awayId) {
      homeId = ids.find(id => id !== awayId)!;
      homeSel.value = homeId;
    }
    renderAll();
  };
}

function renderPanel(team: Team, panelId: string, isHome: boolean): void {
  const panel = document.getElementById(panelId)!;
  const slots = FORMATION_NAMES.includes(team.formation)
    ? (requireFormationSlots(team))
    : requireFormationSlots(team);

  panel.innerHTML = `
    <h2>${team.name} ${isHome ? '(Ev)' : '(Dep)'}</h2>
    <div class="section">
      <div class="section-title">Diziliş</div>
      <select id="formation-${team.id}">
        ${FORMATION_NAMES.map(formation =>
          `<option value="${formation}" ${team.formation === formation ? 'selected' : ''}>${formation}</option>`
        ).join('')}
      </select>
    </div>
    <div class="section">
      <div class="section-title">İlk 11</div>
      ${slots.map((slot, index) => {
        const currentId = team.startingXI[index];
        const used = new Set(team.startingXI.filter((_, i) => i !== index));
        const candidates = team.players
          .filter(player =>
            !used.has(player.id) &&
            (slot.position === 'GK' ? player.position === 'GK' : player.position !== 'GK')
          )
          .sort((a, b) =>
            Number(b.position === slot.position) - Number(a.position === slot.position)
          );
        return `<div class="player-slot">${slot.position}
          <select data-team="${team.id}" data-idx="${index}">
            ${candidates.map(player =>
              `<option value="${player.id}" ${player.id === currentId ? 'selected' : ''}>${player.name} (${player.position})</option>`
            ).join('')}
          </select>
        </div>`;
      }).join('')}
    </div>
    <div class="section">
      <div class="section-title">Taktikler</div>
      <div class="tactics">
        <label>Oyun stili
          <select id="style-${team.id}">
            ${STYLES.map(style =>
              `<option value="${style}" ${team.tactics.style === style ? 'selected' : ''}>${STYLE_LABELS[style]}</option>`
            ).join('')}
          </select>
        </label>
        ${TACTICS.map(tactic => `
          <label>${tactic.label}
            <input type="range" min="0" max="100" step="1"
              data-tactic="${tactic.key}" data-team="${team.id}"
              value="${team.tactics[tactic.key]}">
            <output>${team.tactics[tactic.key]}</output>
          </label>
        `).join('')}
      </div>
    </div>`;

  const formationSelect = document.getElementById(`formation-${team.id}`) as HTMLSelectElement;
  formationSelect.addEventListener('change', () => {
    team.formation = formationSelect.value as Team['formation'];
    renderPanel(team, panelId, isHome);
  });

  panel.querySelectorAll<HTMLSelectElement>('select[data-team]').forEach(select => {
    select.addEventListener('change', () => {
      const index = Number(select.dataset.idx);
      team.startingXI[index] = select.value;
      renderPanel(team, panelId, isHome);
    });
  });

  const styleSelect = document.getElementById(`style-${team.id}`) as HTMLSelectElement;
  styleSelect.addEventListener('change', () => {
    applyTacticsFromPanel(team, styleSelect.value as TacticStyle, panel);
  });

  panel.querySelectorAll<HTMLInputElement>('input[data-tactic]').forEach(input => {
    input.addEventListener('input', () => {
      const output = input.parentElement?.querySelector('output');
      if (output) output.textContent = input.value;
      applyTacticsFromPanel(team, team.tactics.style, panel);
    });
  });
}

function requireFormationSlots(team: Team) {
  // Ayrı fonksiyon, panelin her yeniden çiziminde güncel dizilişi okur.
  return buildSlots(team.formation);
}

function buildSlots(formation: Team['formation']) {
  return FORMATION_NAMES.includes(formation)
    ? getSlots(formation)
    : getSlots('4-4-2');
}

function getSlots(formation: Team['formation']) {
  // Import edilen fonksiyonla 22 dizilişin aynı slot tanımını kullan.
  return buildFormationSlots(formation);
}

function applyTacticsFromPanel(team: Team, style: TacticStyle, panel: HTMLElement): void {
  const values = {} as Record<(typeof TACTICS)[number]['key'], number>;
  for (const tactic of TACTICS) {
    const input = panel.querySelector<HTMLInputElement>(
      `input[data-tactic="${tactic.key}"]`
    );
    values[tactic.key] = input ? Number(input.value) : team.tactics[tactic.key];
  }
  setTactics(
    team.id, style,
    values.width, values.depth, values.pressing,
    values.tempo, values.passingRange
  );
}

function renderAll(): void {
  const home = TEAMS[homeId];
  const away = TEAMS[awayId];
  renderPanel(home, 'home-panel', true);
  renderPanel(away, 'away-panel', false);
  document.getElementById('vs-label')!.textContent = `${home.name} vs ${away.name}`;
  document.getElementById('result')!.style.display = 'none';
}

document.getElementById('sim-btn')!.addEventListener('click', () => {
  const button = document.getElementById('sim-btn') as HTMLButtonElement;
  button.disabled = true;
  button.textContent = 'Hesaplanıyor...';

  setTimeout(() => {
    try {
      const home = TEAMS[homeId];
      const away = TEAMS[awayId];
      const prediction = predictMatch(home, away, 10000);
      const result = document.getElementById('result')!;
      const fmt = (value: number) => Number.isFinite(value) ? value : 0;

      result.style.display = 'block';
      result.innerHTML = `
        <h2>${home.name} vs ${away.name} — Sonuç</h2>
        <div class="odds-grid">
          <div class="odds-cell"><div class="label">${home.name}</div><div class="value">${fmt(prediction.odds.home)}</div><div class="pct">% ${fmt(prediction.homeWinPct)}</div></div>
          <div class="odds-cell"><div class="label">Beraberlik</div><div class="value">${fmt(prediction.odds.draw)}</div><div class="pct">% ${fmt(prediction.drawPct)}</div></div>
          <div class="odds-cell"><div class="label">${away.name}</div><div class="value">${fmt(prediction.odds.away)}</div><div class="pct">% ${fmt(prediction.awayWinPct)}</div></div>
        </div>
        <p>En olası skor: <b>${prediction.mostLikelyScore}</b> · Ort. gol: ${fmt(prediction.avgGoals)} · 2.5 üst: %${fmt(prediction.over25Pct)} · KG: %${fmt(prediction.bttsPct)}</p>
        <div class="score-list">${Object.entries(prediction.scoreDistribution)
          .sort((a, b) => b[1] - a[1]).slice(0, 5)
          .map(([score, value]) => `<div class="score-item"><div class="score">${score}</div>%${fmt(value)}</div>`)
          .join('')}</div>`;
    } catch (error) {
      alert('Simülasyon hatası: ' + error);
      console.error(error);
    } finally {
      button.disabled = false;
      button.textContent = 'SİMÜLE ET (10.000)';
    }
  }, 10);
});

renderTeamSelector();
renderAll();
