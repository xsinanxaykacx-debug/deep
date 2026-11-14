import { TEAMS } from './squads';
import { FORMATION_NAMES, buildFormationSlots, validateFormationSpecs } from './core';
import { simulateMatch } from './match';
import { seed } from './chance';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function run(): void {
  validateFormationSpecs();

  for (const formation of FORMATION_NAMES) {
    const slots = buildFormationSlots(formation);
    assert(slots.length === 11, `${formation}: 11 slot üretmedi.`);
    assert(slots[0].position === 'GK', `${formation}: kaleci ilk slotta değil.`);
    assert(slots.filter(slot => slot.position === 'GK').length === 1,
      `${formation}: kaleci slotu sayısı hatalı.`);
    assert(slots.every(slot => slot.primaryZone >= 0 && slot.primaryZone <= 11),
      `${formation}: saha bölgesi sınır dışında.`);
  }

  const home = TEAMS.gs;
  const away = TEAMS.fb;
  assert(home && away, 'Test takımları bulunamadı.');

  const homeConditions = home.players.map(player => player.condition);
  const awayConditions = away.players.map(player => player.condition);

  seed(20261114);
  for (let i = 0; i < 250; i++) {
    const result = simulateMatch(home, away);

    assert(Number.isInteger(result.minute) && result.minute >= 90 && result.minute <= 93,
      'Maç süresi geçersiz.');
    assert(Number.isInteger(result.homeScore) && result.homeScore >= 0,
      'Ev sahibi skoru geçersiz.');
    assert(Number.isInteger(result.awayScore) && result.awayScore >= 0,
      'Deplasman skoru geçersiz.');
    assert(result.homeScore <= result.stats.homeShots,
      'Ev sahibi gol sayısı şut sayısından fazla.');
    assert(result.awayScore <= result.stats.awayShots,
      'Deplasman gol sayısı şut sayısından fazla.');
    assert(result.stats.homeShots >= 0 && result.stats.awayShots >= 0,
      'Şut istatistiği negatif.');
    assert(result.stats.homeCorners >= 0 && result.stats.awayCorners >= 0,
      'Korner istatistiği negatif.');
    assert(result.stats.homeFouls >= 0 && result.stats.awayFouls >= 0,
      'Faul istatistiği negatif.');
    assert(result.zone >= 0 && result.zone <= 11,
      'Maç sonu top bölgesi geçersiz.');
  }

  assert(home.players.every((player, index) => player.condition === homeConditions[index]),
    'Simülasyon ev sahibi orijinal kondisyonlarını değiştirdi.');
  assert(away.players.every((player, index) => player.condition === awayConditions[index]),
    'Simülasyon deplasman orijinal kondisyonlarını değiştirdi.');

  console.log('OK: 22 diziliş + 250 tekrarlanabilir maç testi geçti.');
}

run();
