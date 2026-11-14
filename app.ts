import * as readline from 'readline';
import { predictMatch } from './predict';
import { TEAMS } from './squads';
import {
  FORMATION_NAMES,
  buildFormationSlots
} from './core';
import type {
  Formation,
  TacticStyle,
  Team
} from './core';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query: string): Promise<string> =>
  new Promise(resolve => rl.question(query, resolve));

const STYLES: TacticStyle[] = [
  'possession',
  'counter',
  'high_press',
  'low_block',
  'wing_play',
  'direct'
];

async function selectNumber(
  prompt: string,
  max: number
): Promise<number> {
  while (true) {
    const answer = (await ask(prompt)).trim();
    const index = Number(answer);

    if (
      answer !== '' &&
      Number.isInteger(index) &&
      index >= 1 &&
      index <= max
    ) {
      return index - 1;
    }

    console.log(`Geçersiz seçim. 1-${max} arasında bir numara gir.`);
  }
}

async function selectTeam(
  prompt: string,
  excludeId?: string
): Promise<string> {
  const ids = Object.keys(TEAMS).filter(id => id !== excludeId);

  if (ids.length === 0) {
    throw new Error('Seçilebilecek takım bulunamadı.');
  }

  console.log(`\n${prompt}`);

  ids.forEach((id, index) => {
    console.log(
      `  ${String(index + 1).padStart(2, ' ')}. ${TEAMS[id].name}`
    );
  });

  const index = await selectNumber('Takım numarası: ', ids.length);
  return ids[index];
}

async function selectFormation(team: Team): Promise<Formation> {
  console.log(`\n=== ${team.name} — DİZİLİŞ SEÇİMİ ===`);

  FORMATION_NAMES.forEach((formation, index) => {
    const selected = formation === team.formation ? ' (Mevcut)' : '';
    console.log(
      `  ${String(index + 1).padStart(2, ' ')}. ${formation}${selected}`
    );
  });

  const index = await selectNumber(
    'Diziliş numarası: ',
    FORMATION_NAMES.length
  );

  const formation = FORMATION_NAMES[index];

  // Formation, Team nesnesinin doğrudan alanıdır.
  team.formation = formation;

  // Seçilen dizilişin 11 slot ürettiğini seçim anında doğrula.
  const slots = buildFormationSlots(formation);
  if (slots.length !== 11) {
    throw new Error(`${formation} dizilişi 11 oyuncu slotu üretmedi.`);
  }

  console.log(`\n${team.name} dizilişi: ${formation}`);
  return formation;
}

async function selectLineup(team: Team): Promise<void> {
  const slots = buildFormationSlots(team.formation);

  console.log(
    `\n=== ${team.name} — ${team.formation} İLK 11 SEÇİMİ ===`
  );

  if (team.players.length < 11) {
    throw new Error(
      `${team.name} kadrosunda ilk 11 oluşturmak için yeterli oyuncu yok.`
    );
  }

  const xi: string[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < slots.length; i++) {
    const position = slots[i].position;
    const currentId = team.startingXI?.[i];

    const currentPlayer = team.players.find(
      player => player.id === currentId
    );

    const validCurrentPlayer =
      currentPlayer &&
      !usedIds.has(currentPlayer.id) &&
      (position === 'GK'
        ? currentPlayer.position === 'GK'
        : currentPlayer.position !== 'GK')
        ? currentPlayer
        : undefined;

    const available = team.players.filter(
      player =>
        !usedIds.has(player.id) &&
        (position === 'GK'
          ? player.position === 'GK'
          : player.position !== 'GK')
    );

    const exact = available.filter(
      player => player.position === position
    );

    const others = available.filter(
      player => player.position !== position
    );

    const candidates = [...exact, ...others];

    console.log(
      `\n[${i + 1}/11] Diziliş mevkii: ${position} — Mevcut: ${
        validCurrentPlayer?.name ?? 'Boş'
      }`
    );

    if (candidates.length === 0) {
      throw new Error(
        `${team.name}: ${position} slotu için uygun oyuncu kalmadı.`
      );
    }

    console.log('\n  Mevkiye uygun oyuncular:');
    if (exact.length === 0) {
      console.log('    Bu mevkiyle eşleşen doğal mevkili oyuncu yok.');
    }

    exact.forEach((player, index) => {
      console.log(
        `    ${index + 1}. ${player.name} (${player.position})`
      );
    });

    console.log('\n  Diğer uygun oyuncular:');
    others.forEach((player, index) => {
      console.log(
        `    ${exact.length + index + 1}. ${player.name} (${player.position})`
      );
    });

    while (true) {
      const answer = (
        await ask('\nOyuncu numarası (boş = mevcut oyuncu): ')
      ).trim();

      if (answer === '') {
        if (!validCurrentPlayer) {
          console.log(
            'Bu slot için geçerli mevcut oyuncu yok. Listeden seçim yap.'
          );
          continue;
        }

        xi.push(validCurrentPlayer.id);
        usedIds.add(validCurrentPlayer.id);
        break;
      }

      const index = Number(answer) - 1;

      if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < candidates.length
      ) {
        const selected = candidates[index];

        xi.push(selected.id);
        usedIds.add(selected.id);
        break;
      }

      console.log(
        `Geçersiz seçim. 1-${candidates.length} arasında bir numara gir.`
      );
    }
  }

  if (xi.length !== 11 || new Set(xi).size !== 11) {
    throw new Error(`${team.name}: İlk 11 geçerli şekilde oluşturulamadı.`);
  }

  team.startingXI = xi;

  console.log(`\n${team.name} ilk 11 tamamlandı.`);
  console.log('Diziliş / oyuncu yerleşimi:');

  slots.forEach((slot, index) => {
    const player = team.players.find(item => item.id === xi[index]);
    console.log(
      `  ${String(index + 1).padStart(2, ' ')}. ${slot.position.padEnd(4, ' ')} — ${
        player?.name ?? 'Bilinmeyen oyuncu'
      }`
    );
  });
}

async function selectTactics(team: Team): Promise<void> {
  console.log(`\n=== ${team.name} — TAKTİK ===`);
  console.log(`Mevcut stil: ${team.tactics.style}`);

  STYLES.forEach((style, index) => {
    const selected = style === team.tactics.style ? ' (Mevcut)' : '';
    console.log(`  ${index + 1}. ${style}${selected}`);
  });

  const answer = (
    await ask('Stil numarası (boş = mevcut): ')
  ).trim();

  if (answer === '') {
    console.log(`${team.name} mevcut taktiğini koruyor: ${team.tactics.style}`);
    return;
  }

  const index = Number(answer) - 1;

  if (
    Number.isInteger(index) &&
    index >= 0 &&
    index < STYLES.length
  ) {
    team.tactics.style = STYLES[index];
  } else {
    console.log('Geçersiz seçim. Mevcut stil korunuyor.');
  }

  console.log(`${team.name} taktiği: ${team.tactics.style}`);
}

async function main(): Promise<void> {
  try {
    console.log('\nFM27 — Süper Lig Maç Simülatörü');
    console.log(`Toplam ${Object.keys(TEAMS).length} takım mevcut.`);
    console.log(`Toplam ${FORMATION_NAMES.length} farklı diziliş mevcut.\n`);

    const homeId = await selectTeam('EV SAHİBİ takım seç:');
    const awayId = await selectTeam('DEPLASMAN takım seç:', homeId);

    const home = TEAMS[homeId] as Team;
    const away = TEAMS[awayId] as Team;

    console.log(`\n${home.name} vs ${away.name}`);

    // Her takım kendi dizilişini seçer.
    await selectFormation(home);
    await selectFormation(away);

    // İlk 11 slotları doğrudan core.ts diziliş tanımından alınır.
    await selectLineup(home);
    await selectLineup(away);

    await selectTactics(home);
    await selectTactics(away);

    console.log('\nMaç ayarları:');
    console.log(
      `${home.name}: ${home.formation} / ${home.tactics.style}`
    );
    console.log(
      `${away.name}: ${away.formation} / ${away.tactics.style}`
    );

    console.log('\n10.000 kez simüle ediliyor...\n');

    const startTime = Date.now();
    const prediction = predictMatch(home, away, 10000);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`=== TAHMİN (${elapsed}s) ===\n`);
    console.log(
      `${home.name} Kazanır: %${prediction.homeWinPct} (Oran: ${prediction.odds.home})`
    );
    console.log(
      `Beraberlik:        %${prediction.drawPct} (Oran: ${prediction.odds.draw})`
    );
    console.log(
      `${away.name} Kazanır: %${prediction.awayWinPct} (Oran: ${prediction.odds.away})`
    );
    console.log(
      `\n2.5 Üst: %${prediction.over25Pct} (Oran: ${prediction.odds.over25})`
    );
    console.log(
      `2.5 Alt: %${prediction.under25Pct} (Oran: ${prediction.odds.under25})`
    );
    console.log(
      `KG Var: %${prediction.bttsPct} (Oran: ${prediction.odds.bttsYes})`
    );
    console.log(
      `\nEn Olası Skor: ${prediction.mostLikelyScore} · Ortalama Gol: ${prediction.avgGoals}`
    );

    console.log('\nEn Sık Skorlar:');
    Object.entries(prediction.scoreDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([score, percentage]) => {
        console.log(`  ${score}: %${percentage}`);
      });
  } catch (error) {
    console.error(
      '\nMaç simülasyonu hatası:',
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

void main();
