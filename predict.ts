// ===== predict.ts =====
import { TEAMS } from './squads';
import { simulateMatch } from './match';
import { resolveLineup } from './core';
import type { Team, TacticStyle } from './core';

export interface Prediction {
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  avgGoals: number;
  over25Pct: number;
  under25Pct: number;
  bttsPct: number;
  mostLikelyScore: string;
  scoreDistribution: Record<string, number>;
  odds: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    under25: number;
    bttsYes: number;
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Simülasyon örnekleminde hiç görülmeyen sonuçlarda Infinity oluşmasını
 * engellemek için yarım gözlemli Laplace düzeltmesi uygular.
 */
function fairOdds(
  count: number,
  total: number,
  outcomeCount: number,
  margin = 1.05
): number {
  const probability = (count + 0.5) / (total + outcomeCount * 0.5);
  return round2(Math.max(1.01, margin / probability));
}

export function predictMatch(
  home: Team | string,
  away: Team | string,
  sims = 10000
): Prediction {
  if (!Number.isInteger(sims) || sims < 1) {
    throw new Error(`Simülasyon sayısı pozitif tam sayı olmalı: ${sims}`);
  }

  const H = typeof home === 'string' ? TEAMS[home] : home;
  const A = typeof away === 'string' ? TEAMS[away] : away;

  if (!H) {
    throw new Error(`Ev sahibi takım bulunamadı: ${String(home)}`);
  }
  if (!A) {
    throw new Error(`Deplasman takımı bulunamadı: ${String(away)}`);
  }
  if (H.id === A.id) {
    throw new Error('Ev sahibi ve deplasman takımı aynı olamaz.');
  }

  // Simülasyona başlamadan kadro/diziliş hatalarını yakala.
  resolveLineup(H);
  resolveLineup(A);

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalGoals = 0;
  let over25 = 0;
  let bttsYes = 0;
  const scores: Record<string, number> = {};

  for (let i = 0; i < sims; i++) {
    const result = simulateMatch(H, A);
    const homeScore = result.homeScore;
    const awayScore = result.awayScore;

    if (
      !Number.isFinite(homeScore) ||
      !Number.isFinite(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      throw new Error(`Maç simülasyonu geçersiz skor üretti: ${homeScore}-${awayScore}`);
    }

    if (homeScore > awayScore) {
      homeWins++;
    } else if (homeScore < awayScore) {
      awayWins++;
    } else {
      draws++;
    }

    const matchGoals = homeScore + awayScore;
    totalGoals += matchGoals;

    if (matchGoals >= 3) over25++;
    if (homeScore > 0 && awayScore > 0) bttsYes++;

    const score = `${homeScore}-${awayScore}`;
    scores[score] = (scores[score] ?? 0) + 1;
  }

  let mostLikelyScore = '0-0';
  let highestCount = -1;

  for (const [score, count] of Object.entries(scores)) {
    if (count > highestCount) {
      highestCount = count;
      mostLikelyScore = score;
    }
  }

  const homeWinPct = round1((homeWins / sims) * 100);
  const drawPct = round1((draws / sims) * 100);
  const awayWinPct = round1((awayWins / sims) * 100);
  const over25Pct = round1((over25 / sims) * 100);
  const under25Pct = round1(100 - (over25 / sims) * 100);
  const bttsPct = round1((bttsYes / sims) * 100);

  const scoreDistribution = Object.fromEntries(
    Object.entries(scores).map(([score, count]) => [
      score,
      round1((count / sims) * 100)
    ])
  );

  return {
    homeWinPct,
    drawPct,
    awayWinPct,
    avgGoals: round2(totalGoals / sims),
    over25Pct,
    under25Pct,
    bttsPct,
    mostLikelyScore,
    scoreDistribution,
    odds: {
      home: fairOdds(homeWins, sims, 3),
      draw: fairOdds(draws, sims, 3),
      away: fairOdds(awayWins, sims, 3),
      over25: fairOdds(over25, sims, 2),
      under25: fairOdds(sims - over25, sims, 2),
      bttsYes: fairOdds(bttsYes, sims, 2)
    }
  };
}

/**
 * Takımın ilk 11 ve yedek listesini atomik olarak doğrular ve kaydeder.
 * İlk 11 sırası seçili dizilişin slot sırasıyla aynı olmalıdır.
 */
export function setLineup(
  teamId: string,
  startingXI: string[],
  bench: string[]
): void {
  const team = TEAMS[teamId];
  if (!team) throw new Error(`Takım yok: ${teamId}`);

  if (startingXI.length !== 11) {
    throw new Error('İlk 11, tam olarak 11 oyuncu olmalı.');
  }

  if (new Set(startingXI).size !== startingXI.length) {
    throw new Error('İlk 11 içinde aynı oyuncu birden fazla seçilemez.');
  }

  if (new Set(bench).size !== bench.length) {
    throw new Error('Yedek listesinde aynı oyuncu birden fazla seçilemez.');
  }

  const squadIds = new Set(team.players.map(player => player.id));
  for (const id of [...startingXI, ...bench]) {
    if (!squadIds.has(id)) {
      throw new Error(`Oyuncu bu takımın kadrosunda bulunamadı: ${id}`);
    }
  }

  const startingIds = new Set(startingXI);
  if (bench.some(id => startingIds.has(id))) {
    throw new Error('Bir oyuncu aynı anda ilk 11 ve yedek olamaz.');
  }

  // Kaleci/saha oyuncusu slot uyumunu ve diziliş slotlarını doğrular.
  resolveLineup({ ...team, startingXI });

  team.startingXI = [...startingXI];
  team.bench = [...bench];
}

export function setTactics(
  teamId: string,
  style: TacticStyle,
  width: number,
  depth: number,
  pressing: number,
  tempo: number,
  passingRange: number
): void {
  const team = TEAMS[teamId];
  if (!team) throw new Error(`Takım yok: ${teamId}`);

  const values: [string, number][] = [
    ['width', width],
    ['depth', depth],
    ['pressing', pressing],
    ['tempo', tempo],
    ['passingRange', passingRange]
  ];

  for (const [name, value] of values) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`${name} değeri 0-100 arasında olmalı: ${value}`);
    }
  }

  team.tactics = {
    ...team.tactics,
    style,
    width,
    depth,
    pressing,
    tempo,
    passingRange
  };
}
