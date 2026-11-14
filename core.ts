// ===== core.ts =====
import type { PitchZone, PitchRow, PitchLane } from './pitch';
import { POSITION_ZONE_WEIGHTS } from './player';
import type { Player, Position } from './player';

export type Formation =
  | '4-4-2' | '4-1-3-2' | '4-1-2-1-2' | '4-2-2-2' | '4-2-3-1' | '4-2-1-2-1' | '4-3-3' | '4-3-2-1' | '4-3-1-2'
  | '3-5-2' | '3-1-4-2' | '3-2-3-2' | '3-3-3-1' | '3-4-3' | '3-4-2-1' | '3-4-1-2'
  | '5-4-1' | '5-3-2' | '5-2-3' | '5-5-0' | '5-3-1-1' | '5-2-2-1';

export interface FormationSlot { position: Position; primaryZone: PitchZone; }
interface LineSpec { line: PitchRow; lanes: PitchLane[]; positions: Position[]; }
export interface FormationSpec { name: Formation; lines: LineSpec[]; }

export const FORMATION_SPECS: Record<Formation, FormationSpec> = {
  '4-4-2': { name: '4-4-2', lines: [
    { line: 'defense',  lanes: ['right','center','center','left'], positions: ['RB','CB','CB','LB'] },
    { line: 'midfield', lanes: ['right','center','center','left'], positions: ['RW','CM','CM','LW'] },
    { line: 'attack',   lanes: ['center','center'],                positions: ['ST','ST'] } ]},
  '4-1-3-2': { name: '4-1-3-2', lines: [
    { line: 'defense',       lanes: ['right','center','center','left'], positions: ['RB','CB','CB','LB'] },
    { line: 'midfield',      lanes: ['center'],                         positions: ['DM'] },
    { line: 'attacking_mid', lanes: ['right','center','left'],          positions: ['RW','AM','LW'] },
    { line: 'attack',        lanes: ['center','center'],                positions: ['ST','ST'] } ]},
  '4-1-2-1-2': { name: '4-1-2-1-2', lines: [
    { line: 'defense',       lanes: ['right','center','center','left'], positions: ['RB','CB','CB','LB'] },
    { line: 'midfield',      lanes: ['center'],                         positions: ['DM'] },
    { line: 'midfield',      lanes: ['right','left'],                   positions: ['CM','CM'] },
    { line: 'attacking_mid', lanes: ['center'],                         positions: ['AM'] },
    { line: 'attack',        lanes: ['center','center'],                positions: ['ST','ST'] } ]},
  '4-2-2-2': { name: '4-2-2-2', lines: [
    { line: 'defense',       lanes: ['right','center','center','left'], positions: ['RB','CB','CB','LB'] },
    { line: 'midfield',      lanes: ['center','center'],                positions: ['DM','DM'] },
    { line: 'attacking_mid', lanes: ['right','left'],                   positions: ['RW','LW'] },
    { line: 'attack',        lanes: ['center','center'],                positions: ['ST','ST'] } ]},
  '4-2-3-1': { name: '4-2-3-1', lines: [
    { line: 'defense',       lanes: ['right','center','center','left'], positions: ['RB','CB','CB','LB'] },
    { line: 'midfield',      lanes: ['center','center'],                positions: ['DM','DM'] },
    { line: 'attacking_mid', lanes: ['right','center','left'],          positions: ['RW','AM','LW'] },
    { line: 'attack',        lanes: ['center'],                         positions: ['ST'] } ]},
  '4-2-1-2-1': { name: '4-2-1-2-1', lines: [
    { line: 'defense',       lanes: ['right','center','center','left'], positions: ['RB','CB','CB','LB'] },
    { line: 'midfield',      lanes: ['center','center'],                positions: ['DM','DM'] },
    { line: 'attacking_mid', lanes: ['center'],                         positions: ['AM'] },
    { line: 'attack',        lanes: ['right','left'],                   positions: ['ST','ST'] },
    { line: 'attack',        lanes: ['center'],                         positions: ['ST'] } ]},
  '4-3-3': { name: '4-3-3', lines: [
    { line: 'defense',  lanes: ['right','center','center','left'], positions: ['RB','CB','CB','LB'] },
    { line: 'midfield', lanes: ['right','center','left'],          positions: ['CM','DM','CM'] },
    { line: 'attack',   lanes: ['right','center','left'],          positions: ['RW','ST','LW'] } ]},
  '4-3-2-1': { name: '4-3-2-1', lines: [
    { line: 'defense',       lanes: ['right','center','center','left'], positions: ['RB','CB','CB','LB'] },
    { line: 'midfield',      lanes: ['right','center','left'],          positions: ['CM','DM','CM'] },
    { line: 'attacking_mid', lanes: ['center','center'],                positions: ['AM','AM'] },
    { line: 'attack',        lanes: ['center'],                         positions: ['ST'] } ]},
  '4-3-1-2': { name: '4-3-1-2', lines: [
    { line: 'defense',       lanes: ['right','center','center','left'], positions: ['RB','CB','CB','LB'] },
    { line: 'midfield',      lanes: ['right','center','left'],          positions: ['CM','DM','CM'] },
    { line: 'attacking_mid', lanes: ['center'],                         positions: ['AM'] },
    { line: 'attack',        lanes: ['center','center'],                positions: ['ST','ST'] } ]},
  '3-5-2': { name: '3-5-2', lines: [
    { line: 'defense',  lanes: ['center','center','center'],                 positions: ['CB','CB','CB'] },
    { line: 'midfield', lanes: ['right','center','center','center','left'],  positions: ['RB','CM','DM','CM','LB'] },
    { line: 'attack',   lanes: ['center','center'],                          positions: ['ST','ST'] } ]},
  '3-1-4-2': { name: '3-1-4-2', lines: [
    { line: 'defense',  lanes: ['center','center','center'],                 positions: ['CB','CB','CB'] },
    { line: 'midfield', lanes: ['center'],                                   positions: ['DM'] },
    { line: 'midfield', lanes: ['right','center','center','left'],           positions: ['RW','CM','CM','LW'] },
    { line: 'attack',   lanes: ['center','center'],                          positions: ['ST','ST'] } ]},
  '3-2-3-2': { name: '3-2-3-2', lines: [
    { line: 'defense',       lanes: ['center','center','center'], positions: ['CB','CB','CB'] },
    { line: 'midfield',      lanes: ['center','center'],          positions: ['DM','DM'] },
    { line: 'attacking_mid', lanes: ['right','center','left'],    positions: ['RW','AM','LW'] },
    { line: 'attack',        lanes: ['center','center'],          positions: ['ST','ST'] } ]},
  '3-3-3-1': { name: '3-3-3-1', lines: [
    { line: 'defense',       lanes: ['center','center','center'], positions: ['CB','CB','CB'] },
    { line: 'midfield',      lanes: ['right','center','left'],    positions: ['CM','DM','CM'] },
    { line: 'attacking_mid', lanes: ['right','center','left'],    positions: ['RW','AM','LW'] },
    { line: 'attack',        lanes: ['center'],                   positions: ['ST'] } ]},
  '3-4-3': { name: '3-4-3', lines: [
    { line: 'defense',  lanes: ['center','center','center'],                 positions: ['CB','CB','CB'] },
    { line: 'midfield', lanes: ['right','center','center','left'],           positions: ['RW','CM','CM','LW'] },
    { line: 'attack',   lanes: ['right','center','left'],                    positions: ['RW','ST','LW'] } ]},
  '3-4-2-1': { name: '3-4-2-1', lines: [
    { line: 'defense',       lanes: ['center','center','center'],            positions: ['CB','CB','CB'] },
    { line: 'midfield',      lanes: ['right','center','center','left'],      positions: ['RW','CM','CM','LW'] },
    { line: 'attacking_mid', lanes: ['center','center'],                     positions: ['AM','AM'] },
    { line: 'attack',        lanes: ['center'],                              positions: ['ST'] } ]},
  '3-4-1-2': { name: '3-4-1-2', lines: [
    { line: 'defense',       lanes: ['center','center','center'],            positions: ['CB','CB','CB'] },
    { line: 'midfield',      lanes: ['right','center','center','left'],      positions: ['RW','CM','CM','LW'] },
    { line: 'attacking_mid', lanes: ['center'],                              positions: ['AM'] },
    { line: 'attack',        lanes: ['center','center'],                     positions: ['ST','ST'] } ]},
  '5-4-1': { name: '5-4-1', lines: [
    { line: 'defense',  lanes: ['right','center','center','center','left'],  positions: ['RB','CB','CB','CB','LB'] },
    { line: 'midfield', lanes: ['right','center','center','left'],           positions: ['RW','CM','CM','LW'] },
    { line: 'attack',   lanes: ['center'],                                   positions: ['ST'] } ]},
  '5-3-2': { name: '5-3-2', lines: [
    { line: 'defense',  lanes: ['right','center','center','center','left'],  positions: ['RB','CB','CB','CB','LB'] },
    { line: 'midfield', lanes: ['right','center','left'],                    positions: ['CM','DM','CM'] },
    { line: 'attack',   lanes: ['center','center'],                          positions: ['ST','ST'] } ]},
  '5-2-3': { name: '5-2-3', lines: [
    { line: 'defense',  lanes: ['right','center','center','center','left'],  positions: ['RB','CB','CB','CB','LB'] },
    { line: 'midfield', lanes: ['center','center'],                          positions: ['DM','DM'] },
    { line: 'attack',   lanes: ['right','center','left'],                    positions: ['RW','ST','LW'] } ]},
  '5-5-0': { name: '5-5-0', lines: [
    { line: 'defense',  lanes: ['right','center','center','center','left'],  positions: ['RB','CB','CB','CB','LB'] },
    { line: 'midfield', lanes: ['right','center','center','center','left'],  positions: ['RW','CM','DM','CM','LW'] } ]},
  '5-3-1-1': { name: '5-3-1-1', lines: [
    { line: 'defense',       lanes: ['right','center','center','center','left'], positions: ['RB','CB','CB','CB','LB'] },
    { line: 'midfield',      lanes: ['right','center','left'],                   positions: ['CM','DM','CM'] },
    { line: 'attacking_mid', lanes: ['center'],                                  positions: ['AM'] },
    { line: 'attack',        lanes: ['center'],                                  positions: ['ST'] } ]},
  '5-2-2-1': { name: '5-2-2-1', lines: [
    { line: 'defense',       lanes: ['right','center','center','center','left'], positions: ['RB','CB','CB','CB','LB'] },
    { line: 'midfield',      lanes: ['center','center'],                         positions: ['DM','DM'] },
    { line: 'attacking_mid', lanes: ['center','center'],                         positions: ['AM','AM'] },
    { line: 'attack',        lanes: ['center'],                                  positions: ['ST'] } ]},
};

const LINE_ORDER: PitchRow[] = ['defense', 'midfield', 'attacking_mid', 'attack'];
const LANE_COL: Record<PitchLane, number> = {
  right: 0,
  center: 1,
  left: 2
};

export const FORMATION_NAMES = Object.keys(
  FORMATION_SPECS
) as Formation[];

/**
 * Diziliş tanımını 1 kaleci + 10 saha oyuncusu olacak şekilde
 * gerçek saha bölgelerine dönüştürür.
 */
export function buildFormationSlots(
  formation: Formation
): FormationSlot[] {
  const spec = FORMATION_SPECS[formation];

  if (!spec) {
    throw new Error(`Bilinmeyen diziliş: ${formation}`);
  }

  const slots: FormationSlot[] = [
    { position: 'GK', primaryZone: 1 as PitchZone }
  ];

  for (const lineSpec of spec.lines) {
    if (lineSpec.lanes.length !== lineSpec.positions.length) {
      throw new Error(
        `${formation}: ${lineSpec.line} satırında mevki ve koridor sayısı eşleşmiyor.`
      );
    }

    const baseRow = LINE_ORDER.indexOf(lineSpec.line);

    if (baseRow < 0) {
      throw new Error(
        `${formation}: geçersiz saha hattı: ${lineSpec.line}`
      );
    }

    // Aynı saha hattındaki gruplar aynı derinlikte kalır.
    // Örn. 4-1-2-1-2 dizilişindeki iki orta saha grubu ayrılmaz.
    const row = baseRow;

    for (let i = 0; i < lineSpec.positions.length; i++) {
      const lane = lineSpec.lanes[i];
      const column = LANE_COL[lane];

      if (column === undefined) {
        throw new Error(
          `${formation}: geçersiz koridor: ${String(lane)}`
        );
      }

      const zone = row * 3 + column;

      if (zone < 0 || zone > 11) {
        throw new Error(
          `${formation}: geçersiz saha bölgesi: ${zone}`
        );
      }

      slots.push({
        position: lineSpec.positions[i],
        primaryZone: zone as PitchZone
      });
    }
  }

  if (slots.length !== 11) {
    throw new Error(
      `${formation}: diziliş 11 oyuncu üretmeli; ${slots.length} slot üretildi.`
    );
  }

  return slots;
}

export type TacticStyle =
  | 'possession'
  | 'counter'
  | 'high_press'
  | 'low_block'
  | 'wing_play'
  | 'direct';

export interface TeamTactics {
  style: TacticStyle;
  width: number;
  depth: number;
  pressing: number;
  tempo: number;
  passingRange: number;
}

export interface Team {
  id: string;
  name: string;
  formation: Formation;
  tactics: TeamTactics;
  players: Player[];
  startingXI: string[];
  bench: string[];
}

export interface ZonePower {
  zone: PitchZone;
  attackPower: number;
  defensePower: number;
  controlPower: number;
}

export interface TacticModifiers {
  zoneBonuses: Partial<Record<PitchZone, number>>;
  passBias: Partial<Record<PitchZone, number>>;
  pressZones: PitchZone[];
}

export const TACTIC_EFFECTS: Record<TacticStyle, TacticModifiers> = {
  possession: {
    zoneBonuses: { 4: 15, 7: 10, 1: 10 },
    passBias: { 4: 1.5, 7: 1.3, 3: 1.1, 5: 1.1 },
    pressZones: [4, 7]
  },
  counter: {
    zoneBonuses: { 9: 15, 11: 15, 10: 10 },
    passBias: { 9: 1.5, 11: 1.5, 10: 1.3 },
    pressZones: [1, 4]
  },
  high_press: {
    zoneBonuses: { 6: 10, 7: 10, 8: 10 },
    passBias: { 6: 1.2, 7: 1.2, 8: 1.2 },
    pressZones: [6, 7, 8, 9, 10, 11]
  },
  low_block: {
    zoneBonuses: { 0: 15, 1: 15, 2: 15 },
    passBias: { 9: 1.4, 11: 1.4 },
    pressZones: [0, 1, 2, 3, 4, 5]
  },
  wing_play: {
    zoneBonuses: { 3: 12, 5: 12, 6: 12, 8: 12, 9: 10, 11: 10 },
    passBias: { 3: 1.4, 5: 1.4, 6: 1.3, 8: 1.3, 9: 1.5, 11: 1.5 },
    pressZones: [3, 5, 6, 8]
  },
  direct: {
    zoneBonuses: { 10: 12, 9: 8, 11: 8 },
    passBias: { 10: 1.6, 9: 1.3, 11: 1.3 },
    pressZones: [4, 7]
  }
};

/** Oyuncunun doğal mevkiine göre bölge uyumu. */
export function zoneWeight(
  player: Player,
  zone: PitchZone
): number {
  if (player.position === 'GK') {
    return zone === 1 ? 1 : 0;
  }

  return POSITION_ZONE_WEIGHTS[player.position]?.[zone] ?? 0;
}

/**
 * Oyuncunun doğal mevkii yerine dizilişte görevlendirildiği rolü
 * esas alır. Böylece 22 diziliş maç motorunun saha dağılımını etkiler.
 */
export function slotZoneWeight(
  player: Player,
  slot: FormationSlot,
  zone: PitchZone
): number {
  if (slot.position === 'GK') {
    return zone === 1 ? 1 : 0;
  }

  const roleWeights = POSITION_ZONE_WEIGHTS[slot.position];

  if (roleWeights) {
    return (roleWeights[zone] ?? 0) * roleFitMultiplier(player, slot.position);
  }

  return zoneWeight(player, zone);
}

/** Doğal mevki ile verilen rol arasındaki uyum katsayısı. */
export function roleFitMultiplier(player: Player, role: Position): number {
  if (player.position === role) return 1;
  if (player.altPositions?.includes(role)) return 0.95;
  if (player.position === 'GK' || role === 'GK') return 0;

  const groups: Record<Position, string> = {
    GK: 'GK', RB: 'FB', LB: 'FB', CB: 'CB',
    DM: 'MID', CM: 'MID', AM: 'AM',
    RW: 'WING', LW: 'WING', ST: 'ST'
  };
  const natural = groups[player.position];
  const assigned = groups[role];

  if (natural === assigned) return 0.82;
  if (
    (natural === 'FB' && assigned === 'CB') ||
    (natural === 'CB' && assigned === 'FB') ||
    (natural === 'MID' && assigned === 'AM') ||
    (natural === 'AM' && assigned === 'MID') ||
    (natural === 'WING' && assigned === 'AM') ||
    (natural === 'AM' && assigned === 'WING') ||
    (natural === 'ST' && assigned === 'AM') ||
    (natural === 'AM' && assigned === 'ST')
  ) return 0.65;

  return 0.45;
}

export function resolveLineup(
  team: Team
): { player: Player; slot: FormationSlot }[] {
  const slots = buildFormationSlots(team.formation);

  if (team.startingXI.length !== 11) {
    throw new Error(
      `${team.name}: startingXI 11 olmalı, ${team.startingXI.length} verildi.`
    );
  }

  if (new Set(team.startingXI).size !== 11) {
    throw new Error(
      `${team.name}: ilk 11'de aynı oyuncu birden fazla kez seçilmiş.`
    );
  }

  const lineup = team.startingXI.map((id, index) => {
    const player = team.players.find(item => item.id === id);

    if (!player) {
      throw new Error(
        `${team.name}: oyuncu bulunamadı: ${id}`
      );
    }

    const slot = slots[index];

    if (!slot) {
      throw new Error(
        `${team.name}: ${index + 1}. diziliş slotu bulunamadı.`
      );
    }

    return { player, slot };
  });

  // Kaleci slotunda kaleci bulunmasını garanti et.
  if (lineup[0].player.position !== 'GK') {
    throw new Error(
      `${team.name}: ilk 11'in ilk oyuncusu kaleci olmalı.`
    );
  }

  if (lineup.slice(1).some(item => item.player.position === 'GK')) {
    throw new Error(
      `${team.name}: kaleci saha oyuncusu slotuna yerleştirilemez.`
    );
  }

  return lineup;
}

export function calculateZonePowers(
  team: Team
): ZonePower[] {
  const lineup = resolveLineup(team);
  const players = lineup.map(item => item.player);

  const avgCondition =
    players.reduce((sum, player) => sum + player.condition, 0) /
    players.length / 100;

  const avgMorale =
    players.reduce((sum, player) => sum + player.morale, 0) /
    players.length / 100;

  const modifier =
    (0.7 + 0.3 * avgCondition) *
    (0.8 + 0.2 * avgMorale);

  const powers: ZonePower[] = [];

  for (let zoneIndex = 0; zoneIndex < 12; zoneIndex++) {
    const zone = zoneIndex as PitchZone;

    let attack = 0;
    let defense = 0;
    let control = 0;

    for (const { player, slot } of lineup) {
      const weight = slotZoneWeight(player, slot, zone);

      if (weight <= 0) continue;

      const attributes = player.attributes;

      attack += weight * (
        attributes.passing +
        attributes.dribbling +
        attributes.shooting +
        attributes.technique +
        attributes.vision +
        attributes.crossing
      ) / 6;

      defense += weight * (
        attributes.tackling +
        attributes.marking +
        attributes.positioning +
        attributes.strength +
        attributes.heading
      ) / 5;

      control += weight * (
        attributes.technique +
        attributes.decisions +
        attributes.composure
      ) / 3;
    }

    powers.push({
      zone,
      attackPower: Math.round(attack * modifier * 10) / 10,
      defensePower: Math.round(defense * modifier * 10) / 10,
      controlPower: Math.round(control * modifier * 10) / 10
    });
  }

  return powers;
}

export function applyTacticModifiers(
  powers: ZonePower[],
  tactics: TeamTactics
): ZonePower[] {
  const modifiers = TACTIC_EFFECTS[tactics.style];

  return powers.map(power => {
    const multiplier =
      1 + (modifiers.zoneBonuses[power.zone] ?? 0) / 100;

    return {
      zone: power.zone,
      attackPower: Math.round(power.attackPower * multiplier * 10) / 10,
      defensePower: Math.round(power.defensePower * multiplier * 10) / 10,
      controlPower: Math.round(power.controlPower * multiplier * 10) / 10
    };
  });
}

export function pickBallCarrier(
  zone: PitchZone,
  lineup: { player: Player; slot: FormationSlot }[]
): Player | null {
  let best: Player | null = null;
  let bestScore = -1;

  for (const { player, slot } of lineup) {
    if (slot.position === 'GK' || player.position === 'GK') {
      continue;
    }

    // Doğal mevki değil, dizilişteki rol esas alınır.
    const baseWeight = slotZoneWeight(player, slot, zone);
    const slotBonus = slot.primaryZone === zone ? 0.3 : 0;
    const weight = baseWeight + slotBonus;

    if (weight <= 0) continue;

    const decisionSkill = (
      player.attributes.positioning +
      player.attributes.decisions
    ) / 2;

    const condition = Math.max(
      0,
      Math.min(100, player.condition)
    ) / 100;

    const score = weight * decisionSkill * condition;

    if (score > bestScore) {
      bestScore = score;
      best = player;
    }
  }

  return best;
}

/** Projedeki 22 diziliş tanımının tamamını başlangıçta doğrular. */
export function validateFormationSpecs(): void {
  for (const formation of FORMATION_NAMES) {
    buildFormationSlots(formation);
  }
}
