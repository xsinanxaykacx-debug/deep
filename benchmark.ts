import { writeFileSync } from 'node:fs';
import { TEAMS } from './squads';
import { TEAM_POWERS } from './teamPower';
import { simulateMatch } from './match';
import { resolveLineup, type Team } from './core';
import { seed } from './chance';

const MATCH_COUNT = 10000;
const RANDOM_SEED = 270271;

interface TeamTotals {
  id: string;
  name: string;
  power: number | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  shots: number;
  shotsOnTarget: number;
  saves: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  points: number;
}

function createTeamTotals(team: Team): TeamTotals {
  return {
    id: team.id,
    name: team.name,
    power: TEAM_POWERS[team.id]?.power ?? null,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    shots: 0,
    shotsOnTarget: 0,
    saves: 0,
    corners: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
    points: 0
  };
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percent(value: number, total: number): number {
  return total === 0 ? 0 : round((value / total) * 100, 1);
}

function updateTeam(
  team: TeamTotals,
  goalsFor: number,
  goalsAgainst: number,
  shots: number,
  shotsOnTarget: number,
  saves: number,
  corners: number,
  fouls: number,
  yellowCards: number,
  redCards: number
): void {
  team.played++;
  team.goalsFor += goalsFor;
  team.goalsAgainst += goalsAgainst;
  team.shots += shots;
  team.shotsOnTarget += shotsOnTarget;
  team.saves += saves;
  team.corners += corners;
  team.fouls += fouls;
  team.yellowCards += yellowCards;
  team.redCards += redCards;

  if (goalsFor > goalsAgainst) {
    team.wins++;
    team.points += 3;
  } else if (goalsFor === goalsAgainst) {
    team.draws++;
    team.points++;
  } else {
    team.losses++;
  }
}

function correlation(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null;

  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;

  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  const denominator = Math.sqrt(varianceX * varianceY);
  return denominator === 0 ? null : round(covariance / denominator, 3);
}

function main(): void {
  const teams = Object.values(TEAMS).sort((a, b) => a.id.localeCompare(b.id));

  if (teams.length < 2) {
    throw new Error(`Benchmark için en az iki takım gerekli. Bulunan: ${teams.length}`);
  }

  for (const team of teams) {
    resolveLineup(team);
  }

  const pairings: Array<[Team, Team]> = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairings.push([teams[i], teams[j]]);
    }
  }

  const teamTotals = new Map<string, TeamTotals>(
    teams.map(team => [team.id, createTeamTotals(team)])
  );

  const scorelines: Record<string, number> = {};
  const goalBuckets = { '0-1': 0, '2-3': 0, '4-5': 0, '6+': 0 };

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalGoals = 0;
  let over25 = 0;
  let btts = 0;
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;
  let totalShots = 0;
  let totalShotsOnTarget = 0;
  let totalSaves = 0;
  let totalCorners = 0;
  let totalFouls = 0;
  let totalYellowCards = 0;
  let totalRedCards = 0;

  seed(RANDOM_SEED);

  for (let index = 0; index < MATCH_COUNT; index++) {
    const pairIndex = index % pairings.length;
    const cycle = Math.floor(index / pairings.length);
    const pair = pairings[pairIndex];
    const home = cycle % 2 === 0 ? pair[0] : pair[1];
    const away = cycle % 2 === 0 ? pair[1] : pair[0];

    const result = simulateMatch(home, away);
    const stats = result.stats;
    const homeGoals = stats.homeScore;
    const awayGoals = stats.awayScore;

    const numericValues = [
      homeGoals, awayGoals,
      stats.homeShots, stats.awayShots,
      stats.homeShotsOnTarget, stats.awayShotsOnTarget,
      stats.homeSaves, stats.awaySaves
    ];

    if (numericValues.some(value => !Number.isFinite(value) || value < 0)) {
      throw new Error(`Geçersiz maç istatistiği: ${home.name} - ${away.name}`);
    }

    if (
      !Number.isInteger(homeGoals) ||
      !Number.isInteger(awayGoals) ||
      stats.homeShotsOnTarget > stats.homeShots ||
      stats.awayShotsOnTarget > stats.awayShots
    ) {
      throw new Error(`İstatistik tutarsızlığı: ${home.name} - ${away.name}`);
    }

    const matchGoals = homeGoals + awayGoals;
    totalGoals += matchGoals;
    totalHomeGoals += homeGoals;
    totalAwayGoals += awayGoals;
    totalShots += stats.homeShots + stats.awayShots;
    totalShotsOnTarget += stats.homeShotsOnTarget + stats.awayShotsOnTarget;
    totalSaves += stats.homeSaves + stats.awaySaves;
    totalCorners += stats.homeCorners + stats.awayCorners;
    totalFouls += stats.homeFouls + stats.awayFouls;
    totalYellowCards += stats.homeYellowCards + stats.awayYellowCards;
    totalRedCards += stats.homeRedCards + stats.awayRedCards;

    if (homeGoals > awayGoals) homeWins++;
    else if (homeGoals < awayGoals) awayWins++;
    else draws++;

    if (matchGoals >= 3) over25++;
    if (homeGoals > 0 && awayGoals > 0) btts++;

    if (matchGoals <= 1) goalBuckets['0-1']++;
    else if (matchGoals <= 3) goalBuckets['2-3']++;
    else if (matchGoals <= 5) goalBuckets['4-5']++;
    else goalBuckets['6+']++;

    const score = `${homeGoals}-${awayGoals}`;
    scorelines[score] = (scorelines[score] ?? 0) + 1;

    const homeTotals = teamTotals.get(home.id)!;
    const awayTotals = teamTotals.get(away.id)!;

    updateTeam(
      homeTotals,
      homeGoals,
      awayGoals,
      stats.homeShots,
      stats.homeShotsOnTarget,
      stats.homeSaves,
      stats.homeCorners,
      stats.homeFouls,
      stats.homeYellowCards,
      stats.homeRedCards
    );

    updateTeam(
      awayTotals,
      awayGoals,
      homeGoals,
      stats.awayShots,
      stats.awayShotsOnTarget,
      stats.awaySaves,
      stats.awayCorners,
      stats.awayFouls,
      stats.awayYellowCards,
      stats.awayRedCards
    );
  }

  const teamReport = [...teamTotals.values()]
    .map(team => ({
      ...team,
      winPct: percent(team.wins, team.played),
      pointsPerMatch: round(team.points / team.played, 3),
      goalsForPerMatch: round(team.goalsFor / team.played, 2),
      goalsAgainstPerMatch: round(team.goalsAgainst / team.played, 2),
      shotsPerMatch: round(team.shots / team.played, 2),
      shotAccuracyPct: percent(team.shotsOnTarget, team.shots)
    }))
    .sort((a, b) => (b.power ?? -1) - (a.power ?? -1));

  const powers = teamReport
    .filter(team => team.power !== null)
    .map(team => team.power as number);
  const pointsPerMatch = teamReport
    .filter(team => team.power !== null)
    .map(team => team.pointsPerMatch);

  const metrics = {
    matches: MATCH_COUNT,
    teams: teams.length,
    uniquePairings: pairings.length,
    averageGoals: round(totalGoals / MATCH_COUNT, 3),
    homeGoalsPerMatch: round(totalHomeGoals / MATCH_COUNT, 3),
    awayGoalsPerMatch: round(totalAwayGoals / MATCH_COUNT, 3),
    homeWinPct: percent(homeWins, MATCH_COUNT),
    drawPct: percent(draws, MATCH_COUNT),
    awayWinPct: percent(awayWins, MATCH_COUNT),
    over25Pct: percent(over25, MATCH_COUNT),
    bttsPct: percent(btts, MATCH_COUNT),
    averageShots: round(totalShots / MATCH_COUNT, 2),
    averageShotsOnTarget: round(totalShotsOnTarget / MATCH_COUNT, 2),
    shotAccuracyPct: percent(totalShotsOnTarget, totalShots),
    averageSaves: round(totalSaves / MATCH_COUNT, 2),
    averageCorners: round(totalCorners / MATCH_COUNT, 2),
    averageFouls: round(totalFouls / MATCH_COUNT, 2),
    averageYellowCards: round(totalYellowCards / MATCH_COUNT, 2),
    averageRedCards: round(totalRedCards / MATCH_COUNT, 3),
    goalsDistributionPct: {
      '0-1': percent(goalBuckets['0-1'], MATCH_COUNT),
      '2-3': percent(goalBuckets['2-3'], MATCH_COUNT),
      '4-5': percent(goalBuckets['4-5'], MATCH_COUNT),
      '6+': percent(goalBuckets['6+'], MATCH_COUNT)
    },
    powerVsPointsPerMatchCorrelation: correlation(powers, pointsPerMatch)
  };

  const topScores = Object.entries(scorelines)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([score, count]) => ({
      score,
      count,
      pct: percent(count, MATCH_COUNT)
    }));

  const report = {
    generatedAt: new Date().toISOString(),
    seed: RANDOM_SEED,
    metrics,
    mostCommonScores: topScores,
    teams: teamReport
  };

  writeFileSync('benchmark-report.json', JSON.stringify(report, null, 2), 'utf8');

  console.log('\n========== FM27 — 10.000 MAÇ MOTOR TESTİ ==========');
  console.log(`Takım: ${teams.length} | Eşleşme: ${pairings.length} | Seed: ${RANDOM_SEED}`);
  console.log('\n--- GENEL MAÇ İSTATİSTİKLERİ ---');
  console.log(`Ortalama gol:             ${metrics.averageGoals}`);
  console.log(`Ev sahibi gol ort.:       ${metrics.homeGoalsPerMatch}`);
  console.log(`Deplasman gol ort.:       ${metrics.awayGoalsPerMatch}`);
  console.log(`Ev sahibi galibiyet:      %${metrics.homeWinPct}`);
  console.log(`Beraberlik:               %${metrics.drawPct}`);
  console.log(`Deplasman galibiyet:      %${metrics.awayWinPct}`);
  console.log(`2.5 Üst:                  %${metrics.over25Pct}`);
  console.log(`Karşılıklı gol:           %${metrics.bttsPct}`);
  console.log(`Şut / maç:                ${metrics.averageShots}`);
  console.log(`İsabetli şut / maç:       ${metrics.averageShotsOnTarget}`);
  console.log(`Şut isabet oranı:         %${metrics.shotAccuracyPct}`);
  console.log(`Kurtarış / maç:           ${metrics.averageSaves}`);
  console.log(`Korner / maç:             ${metrics.averageCorners}`);
  console.log(`Faul / maç:               ${metrics.averageFouls}`);
  console.log(`Sarı kart / maç:          ${metrics.averageYellowCards}`);
  console.log(`Kırmızı kart / maç:       ${metrics.averageRedCards}`);
  console.log(`Güç-puan korelasyonu:     ${metrics.powerVsPointsPerMatchCorrelation ?? 'hesaplanamadı'}`);

  console.log('\n--- TOPLAM GOL DAĞILIMI ---');
  for (const [range, pct] of Object.entries(metrics.goalsDistributionPct)) {
    console.log(`${range.padEnd(5)} gol: %${pct}`);
  }

  console.log('\n--- EN SIK SKORLAR ---');
  for (const item of topScores) {
    console.log(`${item.score.padEnd(5)} ${String(item.count).padStart(5)} maç  %${item.pct}`);
  }

  console.log('\n--- TAKIM PERFORMANSI (GÜÇ SIRASI) ---');
  console.log('Takım'.padEnd(24) + 'G-M-B-M'.padEnd(14) + 'P/M'.padEnd(8) + 'AG/M'.padEnd(8) + 'YG/M'.padEnd(8) + 'Güç');
  for (const team of teamReport) {
    const record = `${team.wins}-${team.draws}-${team.losses}`;
    console.log(
      team.name.padEnd(24) +
      record.padEnd(14) +
      team.pointsPerMatch.toFixed(2).padEnd(8) +
      team.goalsForPerMatch.toFixed(2).padEnd(8) +
      team.goalsAgainstPerMatch.toFixed(2).padEnd(8) +
      (team.power?.toFixed(3) ?? 'N/A')
    );
  }

  console.log('\nRapor dosyası: benchmark-report.json');
  console.log('Not: Bu test motoru değiştirmez; yalnızca mevcut davranışı ölçer.\n');
}

main();
