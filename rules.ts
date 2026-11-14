
// ===== rules.ts =====

import type { PitchZone } from './pitch';
import { PITCH_ZONES, ZONE_NEIGHBORS } from './pitch';

import type { Player, PlayerAttributes } from './player';
import { pickBallCarrier, TACTIC_EFFECTS } from './core';
import type { FormationSlot, TacticStyle, TeamTactics } from './core';

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
  isShot?: boolean;
  onTarget?: boolean;
  saved?: boolean;
  isFoul?: boolean;
  isCard?: 'yellow' | 'red' | null;
  isCorner?: boolean;

  // Faulü yapan gerçek savunmacı.
  foulPlayerId?: string;

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

function safePick<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return pick(items);
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

function tacticalDefensiveSkill(
  player: Player,
  attr: keyof PlayerAttributes,
  tactics?: TeamTactics
): number {
  const pressing = tactics ? clamp(tactics.pressing, 0, 100) : 50;
  return skill(player, attr) * (0.85 + pressing * 0.003);
}

// --------------------------------------------------
// SAVUNMACI BULMA
// --------------------------------------------------

export function findDefender(
  target: PitchZone,
  oppLineup: LineupEntry[]
): Player | null {
  if (oppLineup.length === 0) return null;

  const mirror = PITCH_ZONES[target]?.mirrorZone;

  if (mirror !== undefined) {
    const defender =
      pickBallCarrier(mirror, oppLineup) ??
      pickBallCarrier(target, oppLineup);

    if (defender) return defender;
  }

  return safePick(oppLineup)?.player ?? null;
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
  defensiveTactics?: TeamTactics
): ActionResult {
  const defender = findDefender(target, oppLineup);

  const passValue = skill(carrier, 'passing');

  // Kontrollü kaos: düşük ihtimalle pas kalitesi düşer.
  const chaosFactor = chance(0.05) ? -5 : 0;

  const defenderValue = defender
    ? tacticalDefensiveSkill(defender, 'tackling', defensiveTactics) * 0.35
    : 4;

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
    !hitPost && roll(shotPower, 8, 0.10);

  const goalkeeperError = chance(0.02);

  const goalProbability = clamp(
    (shotPower / Math.max(1, goalkeeperValue * 1.5)) * 0.45,
    0.10,
    0.50
  );

  const isGoal =
    (onTarget || goalkeeperError) &&
    chance(goalProbability);

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
    isShot: true,
    onTarget: onTarget || goalkeeperError,
    saved: !isGoal && (onTarget || goalkeeperError),
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
  const defender = findDefender(zone, oppLineup);

  const dribbleValue = skill(carrier, 'dribbling');

  const defenderValue = defender
    ? tacticalDefensiveSkill(defender, 'marking', defensiveTactics)
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

  const defender = findDefender(
    10 as PitchZone,
    oppLineup
  );

  const crossValue = skill(carrier, 'crossing');

  const defenderValue = defender
    ? (
        tacticalDefensiveSkill(defender, 'heading', defensiveTactics) * 0.5 +
        tacticalDefensiveSkill(defender, 'strength', defensiveTactics) * 0.5
      )
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

    const headerOnTarget = headerSuccess && chance(0.65);
    const isGoal = headerOnTarget && chance(0.45);

    if (isGoal) {
      return {
        success: true,
        nextZone: 10 as PitchZone,
        possessionChange: true,
        goal: true,
        isShot: true,
        onTarget: true,
        saved: false,
        text: `KAFA GOLÜ! ${striker.name} (Orta: ${carrier.name})`
      };
    }

    return {
      success: true,
      nextZone: 10 as PitchZone,
      possessionChange: false,
      isShot: true,
      onTarget: headerOnTarget,
      saved: headerOnTarget,
      text: `${carrier.name} orta yaptı, kafa vuruşu sonuçsuz kaldı.`
    };
  }

  return {
    success: false,
    nextZone: 10 as PitchZone,
    possessionChange: true,
    text: `${carrier.name}'in ortası kesildi`
  };
}

// --------------------------------------------------
// AKSİYON SEÇİMİ
// --------------------------------------------------

export function chooseAction(
  carrier: Player,
  zone: PitchZone
): ActionType {
  // Ceza sahasında şut önceliği.
  if (zone === 10 && chance(0.60)) {
    return 'shot';
  }

  // Kanatlarda orta.
  if (
    (zone === 9 || zone === 11) &&
    chance(0.35)
  ) {
    return 'cross';
  }

  // Orta sahadan uzaktan şut.
  if (
    zone >= 6 &&
    zone <= 8 &&
    chance(0.10)
  ) {
    return 'shot';
  }

  // İyi çalım yeteneğine sahip oyuncular.
  if (
    skill(carrier, 'dribbling') > 14 &&
    chance(0.15)
  ) {
    return 'dribble';
  }

  return 'pass';
}

// --------------------------------------------------
// PAS HEDEFİ
// --------------------------------------------------

function weightedZonePick(
  zones: PitchZone[],
  weightFor: (zone: PitchZone) => number
): PitchZone {
  if (zones.length === 0) throw new Error('Pas hedefi için uygun bölge bulunamadı.');
  const weights = zones.map(zone => Math.max(0.01, weightFor(zone)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let threshold = rand() * total;
  for (let index = 0; index < zones.length; index++) {
    threshold -= weights[index];
    if (threshold <= 0) return zones[index];
  }
  return zones[zones.length - 1];
}

/**
 * Pas hedefini takım stili ve sayısal taktik ayarlarıyla seçer.
 * Eski string parametresi de geriye dönük uyumluluk için desteklenir.
 */
export function choosePassTarget(
  zone: PitchZone,
  carrier: Player,
  tacticsOrStyle: string | TeamTactics
): PitchZone {
  const tactics = typeof tacticsOrStyle === 'string' ? undefined : tacticsOrStyle;
  const style = typeof tacticsOrStyle === 'string' ? tacticsOrStyle : tacticsOrStyle.style;
  const neighbors = ZONE_NEIGHBORS[zone] ?? [];
  if (neighbors.length === 0) return getForwardZone(zone);

  const forward = neighbors.filter(target => target > zone);
  const backward = neighbors.filter(target => target < zone);
  const styleBias = TACTIC_EFFECTS[style as TacticStyle]?.passBias ?? {};

  const width = clamp(tactics?.width ?? 50, 0, 100);
  const depth = clamp(tactics?.depth ?? 50, 0, 100);
  const tempo = clamp(tactics?.tempo ?? 50, 0, 100);
  const passingRange = clamp(tactics?.passingRange ?? 50, 0, 100);

  const targetWeight = (target: PitchZone): number => {
    const isWideLane = target % 3 !== 1;
    const widthDelta = (width - 50) / 100;
    const widthFactor = isWideLane ? 1 + widthDelta * 0.5 : 1 - widthDelta * 0.5;
    const directionFactor = target > zone ? 1.15 : 0.9;
    return Math.max(0.01, widthFactor * directionFactor * (styleBias[target] ?? 1));
  };

  const forwardChance = clamp(0.65 + (tempo - 50) * 0.002 + (depth - 50) * 0.001, 0.45, 0.85);
  const backwardChance = clamp((style === 'possession' ? 0.4 : 0.1) + (50 - tempo) * 0.002, 0.05, 0.45);
  const longPassChance = clamp(0.1 + passingRange * 0.0025, 0.1, 0.35);

  if (style === 'counter' && forward.length > 0 && chance(clamp(0.85 + (tempo - 50) * 0.001, 0.75, 0.95))) {
    return weightedZonePick(forward, targetWeight);
  }
  if (style === 'possession' && backward.length > 0 && chance(backwardChance)) {
    return weightedZonePick(backward, targetWeight);
  }
  if (skill(carrier, 'longPassing') > 14 && chance(longPassChance)) {
    return weightedZonePick(neighbors, targetWeight);
  }
  if (forward.length > 0 && chance(forwardChance)) {
    return weightedZonePick(forward, targetWeight);
  }
  if (backward.length > 0 && chance(0.1)) {
    return weightedZonePick(backward, targetWeight);
  }
  return weightedZonePick(neighbors, targetWeight);
}
