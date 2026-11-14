
// ===== rules.ts =====

import type { PitchZone } from './pitch';
import { PITCH_ZONES, ZONE_NEIGHBORS } from './pitch';

import type { Player, PlayerAttributes } from './player';
import { slotZoneWeight } from './core';
import type { FormationSlot, TeamTactics } from './core';

import { roll, pick, chance, rand } from './chance';

export type ActionType = 'pass' | 'shot' | 'dribble' | 'cross';

type LineupEntry = {
  player: Player;
  slot: FormationSlot;
};

export interface ActionResult {
  success: boolean;
  nextZone: PitchZone;
  possessionChange: boolean;

  goal?: boolean;
  isFoul?: boolean;
  isCard?: 'yellow' | 'red' | null;
  isCorner?: boolean;

  // Faulü yapan gerçek savunmacı.
  foulPlayerId?: string;
  isShot?: boolean;

  text: string;
}

interface FoulResult {
  foul: boolean;
  card: 'yellow' | 'red' | null;
  playerId?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pressingLevel(tactics?: TeamTactics): number {
  const base = tactics?.pressing ?? 50;
  const styleBonus = tactics?.style === 'high_press'
    ? 12
    : tactics?.style === 'low_block'
      ? -10
      : 0;
  return clamp(base + styleBonus, 0, 100);
}

function getForwardZone(zone: PitchZone): PitchZone {
  return Math.min(11, zone + 1) as PitchZone;
}

// --------------------------------------------------
// OYUNCU YETENEKLERİ
// --------------------------------------------------

export function skill(
  player: Player,
  attr: keyof PlayerAttributes
): number {
  const value = player.attributes[attr] as number;
  const condition = clamp(player.condition ?? 100, 0, 100);

  return value * (0.6 + 0.4 * condition / 100);
}

// --------------------------------------------------
// SAVUNMACI BULMA
// --------------------------------------------------

export function findDefender(
  target: PitchZone,
  oppLineup: LineupEntry[],
  tactics?: TeamTactics
): Player | null {
  if (oppLineup.length === 0) return null;

  // Hücum bölgesini savunma takımının kendi yönüne bir kez çevir.
  const defendZone = PITCH_ZONES[target].mirrorZone;
  const targetInfo = PITCH_ZONES[defendZone];
  const depth = clamp(tactics?.depth ?? 50, 0, 100);
  const width = clamp(tactics?.width ?? 50, 0, 100);
  const pressing = pressingLevel(tactics);
  const styleDepth = tactics?.style === 'high_press' ? 0.20 : tactics?.style === 'low_block' ? -0.20 : 0;
  const desiredRow = clamp(
    Math.floor(targetInfo.id / 3) + (depth - 50) / 100 + styleDepth,
    0,
    3
  );

  const ranked = oppLineup
    .filter(item => item.slot.position !== 'GK' && item.player.position !== 'GK')
    .map(item => {
      const info = PITCH_ZONES[item.slot.primaryZone];
      const rowDistance = Math.abs(Math.floor(info.id / 3) - desiredRow);
      const laneDistance = Math.abs(
        ['right', 'center', 'left'].indexOf(info.lane) -
        ['right', 'center', 'left'].indexOf(targetInfo.lane)
      );
      const lateralPenalty = laneDistance * (1.25 - width / 200);
      const spatial = 1 / (1 + rowDistance + lateralPenalty);
      const zoneFit = slotZoneWeight(item.player, item.slot, defendZone);
      const defensiveSkill =
        skill(item.player, 'tackling') * 0.30 +
        skill(item.player, 'marking') * 0.30 +
        skill(item.player, 'positioning') * 0.25 +
        skill(item.player, 'strength') * 0.15;
      const pressFactor = 0.85 + pressing / 100 * 0.30;
      const score = (defensiveSkill * 0.65 + zoneFit * 7) * spatial * pressFactor;
      return { player: item.player, score };
    })
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) return null;
  const candidates = ranked.slice(0, Math.min(3, ranked.length));
  const total = candidates.reduce((sum, item) => sum + Math.max(0.1, item.score), 0);
  let ticket = rand() * total;
  for (const item of candidates) {
    ticket -= Math.max(0.1, item.score);
    if (ticket <= 0) return item.player;
  }
  return candidates[0].player;
}

// --------------------------------------------------
// FAUL VE KART MEKANİZMASI
// --------------------------------------------------

export function checkFoul(
  defender: Player | null
): FoulResult {
  if (!defender) {
    return {
      foul: false,
      card: null
    };
  }

  const aggression = clamp(
    defender.attributes.aggression ?? 10,
    1,
    20
  );

  const foulChance = (aggression / 20) * 0.15;

  if (!chance(foulChance)) {
    return {
      foul: false,
      card: null
    };
  }

  const cardChance = (aggression / 20) * 0.3;

  let card: 'yellow' | 'red' | null = null;

  if (chance(cardChance * 0.1)) {
    card = 'red';
  } else if (chance(cardChance)) {
    card = 'yellow';
  }

  return {
    foul: true,
    card,
    playerId: defender.id
  };
}

function createFoulResult(
  defender: Player,
  carrier: Player,
  zone: PitchZone,
  card: 'yellow' | 'red' | null
): ActionResult {
  return {
    success: false,
    nextZone: zone,
    possessionChange: false,
    isFoul: true,
    isCard: card,
    foulPlayerId: defender.id,
    text: `Faul! ${defender.name}, ${carrier.name}'i durdurdu.`
  };
}

// --------------------------------------------------
// PAS
// --------------------------------------------------

export function resolvePass(
  carrier: Player,
  target: PitchZone,
  oppLineup: LineupEntry[],
  defensiveTactics?: TeamTactics,
  sourceZone?: PitchZone
): ActionResult {
  const defender = findDefender(target, oppLineup, defensiveTactics);

  const longPass = Math.abs(target - (sourceZone ?? target)) >= 3;
  const passValue = longPass
    ? skill(carrier, 'passing') * 0.45 + skill(carrier, 'longPassing') * 0.55 - 0.6
    : skill(carrier, 'passing');

  // Kontrollü kaos: düşük ihtimalle pas kalitesi düşer.
  const chaosFactor = chance(0.05) ? -5 : 0;

  const defenderValue = defender
    ? (
        skill(defender, 'tackling') * 0.45 +
        skill(defender, 'marking') * 0.30 +
        skill(defender, 'positioning') * 0.25
      ) * (0.85 + pressingLevel(defensiveTactics) / 100 * 0.30)
    : 5;

  const success = roll(
    passValue + chaosFactor,
    defenderValue,
    0.15
  );

  if (!success && defender) {
    const foul = checkFoul(defender);

    if (foul.foul) {
      return createFoulResult(
        defender,
        carrier,
        target,
        foul.card
      );
    }
  }

  return {
    success,
    nextZone: target,
    possessionChange: !success,
    text: success
      ? `${carrier.name} pas verdi (Zone ${target})`
      : `${carrier.name} pası kesildi`
  };
}

// --------------------------------------------------
// ŞUT
// --------------------------------------------------

export function resolveShot(
  carrier: Player,
  zone: PitchZone,
  oppLineup: LineupEntry[]
): ActionResult {
  const goalkeeper = oppLineup.find(
    item => item.player.position === 'GK'
  )?.player;

  const goalkeeperValue = goalkeeper
    ? (
        skill(goalkeeper, 'goalkeeping') * 0.7 +
        skill(goalkeeper, 'reflexes') * 0.3
      )
    : 8;

  const distanceMultiplier =
    zone === 10
      ? 1
      : zone === 9 || zone === 11
        ? 0.8
        : 0.55;

  const shotPower =
    skill(carrier, 'shooting') * distanceMultiplier;

  const hitPost = chance(0.03);

  const onTarget =
    !hitPost && roll(shotPower, goalkeeperValue * 0.72, 0.12);

  const goalkeeperError = !hitPost && onTarget && chance(0.015);

  const goalProbability = clamp(
    (shotPower / Math.max(1, goalkeeperValue * 1.35)) * 0.34,
    0.035,
    0.42
  );

  // Direğe çarpan top ve kalecinin kontrol ettiği şut gol olamaz.
  const isGoal =
    !hitPost && onTarget &&
    (goalkeeperError || chance(goalProbability));

  let text: string;

  if (isGoal) {
    text = `GOL! ${carrier.name} (Zone ${zone})`;
  } else if (hitPost) {
    text = `Direkten döndü: ${carrier.name}`;
  } else if (goalkeeperError) {
    text = `Kaleci hatası, ancak gol olmadı!`;
  } else if (onTarget) {
    text = `Kaleci kurtardı: ${carrier.name}`;
  } else {
    text = `Şut kaçtı: ${carrier.name}`;
  }

  return {
    success: isGoal,
    nextZone: 4 as PitchZone,
    possessionChange: true,
    goal: isGoal,
    text
  };
}

// --------------------------------------------------
// ÇALIM
// --------------------------------------------------

export function resolveDribble(
  carrier: Player,
  zone: PitchZone,
  oppLineup: LineupEntry[],
  defensiveTactics?: TeamTactics
): ActionResult {
  const defender = findDefender(zone, oppLineup, defensiveTactics);

  const dribbleValue = skill(carrier, 'dribbling');

  const defenderValue = defender
    ? (
        skill(defender, 'marking') * 0.45 +
        skill(defender, 'tackling') * 0.35 +
        skill(defender, 'positioning') * 0.20
      ) * (0.85 + clamp(defensiveTactics?.pressing ?? 50, 0, 100) / 100 * 0.30)
    : 5;

  const success = roll(
    dribbleValue,
    defenderValue,
    0.2
  );

  const nextZone = success
    ? Math.min(11, zone + 3) as PitchZone
    : zone;

  // Başarısız çalımda faul kontrolü.
  if (!success && defender && chance(0.1)) {
    const foul = checkFoul(defender);

    if (foul.foul) {
      return createFoulResult(
        defender,
        carrier,
        zone,
        foul.card
      );
    }
  }

  return {
    success,
    nextZone,
    possessionChange: !success,
    text: success
      ? `${carrier.name} adam geçti (Zone ${nextZone})`
      : `${carrier.name} topu kaybetti`
  };
}

// --------------------------------------------------
// ORTA VE KAFA VURUŞU
// --------------------------------------------------

export function resolveCross(
  carrier: Player,
  zone: PitchZone,
  oppLineup: LineupEntry[],
  attackingLineup: LineupEntry[] = [],
  defensiveTactics?: TeamTactics
): ActionResult {
  // Hücum oyuncusu rakip kadrodan değil kendi kadrosundan seçilir.
  const availableAttackers = attackingLineup.filter(
    item => item.player.position !== 'GK'
  );

  const striker =
    availableAttackers.find(
      item => item.player.position === 'ST'
    )?.player ??
    availableAttackers
      .map(item => item.player)
      .sort(
        (a, b) =>
          skill(b, 'heading') - skill(a, 'heading')
      )[0] ??
    carrier;

  const targetZone = (zone === 9 ? 9 : zone === 11 ? 11 : 10) as PitchZone;
  const defender = findDefender(targetZone, oppLineup, defensiveTactics);
  const goalkeeper = oppLineup.find(item => item.player.position === 'GK')?.player;

  const crossValue = skill(carrier, 'crossing');

  const defenderValue = defender
    ? (
        skill(defender, 'heading') * 0.5 +
        skill(defender, 'strength') * 0.5
      ) * (0.90 + pressingLevel(defensiveTactics) / 500)
    : 5;

  // Korner.
  if (chance(0.20)) {
    return {
      success: false,
      nextZone: 10 as PitchZone,
      possessionChange: false,
      isCorner: true,
      text: `${carrier.name}'in ortası savunmaya çarptı. Korner!`
    };
  }

  const crossSuccess = roll(
    crossValue,
    defenderValue,
    0.15
  );

  // Başarısız ortada faul kontrolü.
  if (!crossSuccess && defender && chance(0.1)) {
    const foul = checkFoul(defender);

    if (foul.foul) {
      return createFoulResult(
        defender,
        carrier,
        zone,
        foul.card
      );
    }
  }

  if (crossSuccess) {
    const headerPower =
      skill(striker, 'heading') * 0.7 +
      skill(striker, 'strength') * 0.3;

    const headerSuccess = roll(
      headerPower,
      defenderValue,
      0.1
    );

    const goalkeeperValue = goalkeeper
      ? skill(goalkeeper, 'goalkeeping') * 0.65 + skill(goalkeeper, 'reflexes') * 0.35
      : 8;
    const headerGoalChance = clamp(
      0.30 + (headerPower - goalkeeperValue) * 0.012,
      0.10,
      0.40
    );
    const isGoal =
      headerSuccess && chance(headerGoalChance);

    if (isGoal) {
      return {
        success: true,
        nextZone: 4 as PitchZone,
        possessionChange: true,
        goal: true,
        isShot: true,
        text: `KAFA GOLÜ! ${striker.name} (Orta: ${carrier.name})`
      };
    }

    return {
      success: true,
      nextZone: targetZone,
      possessionChange: true,
      isShot: true,
      text: `${carrier.name} orta yaptı, kafa vuruşu sonuçsuz kaldı.`
    };
  }

  return {
    success: false,
    nextZone: targetZone,
    possessionChange: true,
    text: `${carrier.name}'in ortası kesildi`
  };
}

// --------------------------------------------------
// AKSİYON SEÇİMİ
// --------------------------------------------------

export function chooseAction(
  carrier: Player,
  zone: PitchZone,
  tactics?: TeamTactics
): ActionType {
  const style = tactics?.style ?? 'balanced';
  const width = clamp(tactics?.width ?? 50, 0, 100);
  const tempo = clamp(tactics?.tempo ?? 50, 0, 100);
  const shotBias = style === 'direct' ? 0.08 : style === 'possession' ? -0.05 : 0;

  // Ceza sahasında şut önceliği.
  if (zone === 10 && chance(clamp(0.58 + shotBias + (tempo - 50) / 500, 0.35, 0.78))) {
    return 'shot';
  }

  // Kanatlarda orta.
  if (
    (zone === 9 || zone === 11) &&
    chance(clamp(0.18 + width / 250 + (style === 'wing_play' ? 0.16 : 0), 0.12, 0.62))
  ) {
    return 'cross';
  }

  // Orta sahadan uzaktan şut.
  if (
    zone >= 6 &&
    zone <= 8 &&
    chance(clamp(0.08 + shotBias, 0.03, 0.20))
  ) {
    return 'shot';
  }

  // İyi çalım yeteneğine sahip oyuncular.
  if (
    skill(carrier, 'dribbling') > 14 &&
    chance(clamp(0.10 + (tempo - 50) / 500, 0.04, 0.22))
  ) {
    return 'dribble';
  }

  return 'pass';
}

// --------------------------------------------------
// PAS HEDEFİ
// --------------------------------------------------

export function choosePassTarget(
  zone: PitchZone,
  carrier: Player,
  tacticsOrStyle: TeamTactics | string,
  passingRangeOverride = 55
): PitchZone {
  const tactics = typeof tacticsOrStyle === 'string' ? undefined : tacticsOrStyle;
  const style = typeof tacticsOrStyle === 'string' ? tacticsOrStyle : tacticsOrStyle.style;
  const passingRange = clamp(tactics?.passingRange ?? passingRangeOverride, 0, 100);
  const neighbors = ZONE_NEIGHBORS[zone] ?? [];

  // Komşu bölge yoksa ileri bölgeye ilerle.
  if (neighbors.length === 0) {
    return getForwardZone(zone);
  }

  const forward = neighbors.filter(
    target => target > zone
  );

  const backward = neighbors.filter(
    target => target < zone
  );

  // Kontra atak: dikine oyun.
  if (
    style === 'counter' &&
    forward.length > 0 &&
    chance(clamp(0.62 + passingRange / 400, 0.55, 0.90))
  ) {
    return pick(forward);
  }

  // Topa sahip olma: kontrollü pas.
  if (
    style === 'possession' &&
    backward.length > 0 &&
    chance(0.40)
  ) {
    return pick(backward);
  }

  // Yüksek pres topu kazandığında dikine ve hızlı çıkış arar.
  if (
    style === 'high_press' &&
    forward.length > 0 &&
    chance(0.78)
  ) {
    return pick(forward);
  }

  // Derin blokta risk azaltılır, geriye/yan pas tercih edilir.
  if (
    style === 'low_block' &&
    backward.length > 0 &&
    chance(0.55)
  ) {
    return pick(backward);
  }

  // Kanat oyunu, uygun komşu bölgeler içinden geniş koridorları seçer.
  if (style === 'wing_play') {
    const wide = neighbors.filter(target => target % 3 !== 1);
    if (wide.length > 0 && chance(0.65)) return pick(wide);
  }

  // Uzun pas.
  if (
    skill(carrier, 'longPassing') > 14 &&
    chance(clamp(0.08 + passingRange / 250, 0.08, 0.48))
  ) {
    return pick(neighbors);
  }

  // İleri pas.
  if (
    forward.length > 0 &&
    chance(clamp(0.48 + passingRange / 400 + (style === 'direct' ? 0.12 : 0), 0.35, 0.88))
  ) {
    return pick(forward);
  }

  // Geri pas.
  if (
    backward.length > 0 &&
    chance(0.10)
  ) {
    return pick(backward);
  }

  return pick(neighbors);
}
