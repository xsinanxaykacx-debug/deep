export interface TeamPower {
  id: string;
  name: string;
  power: number;
  attackStrength: number;
  defenseStrength: number;
  lastSeasonPts: number;
  currentPts: number;
  squadValue: number;
}

interface RawTeamPower {
  last: number;
  current: number;
  value: number;
}

const RAW: Record<string, RawTeamPower> = {
  gs:   { last: 95, current: 77, value: 337 },
  fb:   { last: 84, current: 74, value: 241 },
  bjk:  { last: 62, current: 60, value: 176 },
  ts:   { last: 51, current: 69, value: 130 },
  ibfk: { last: 54, current: 57, value: 85 },
  goz:  { last: 50, current: 55, value: 66 },
  sam:  { last: 64, current: 51, value: 56 },
  riz:  { last: 49, current: 41, value: 40 },
  kon:  { last: 46, current: 40, value: 39 },
  ala:  { last: 45, current: 37, value: 34 },
  gaz:  { last: 45, current: 37, value: 35 },
  kas:  { last: 47, current: 35, value: 31 },
  kay:  { last: 45, current: 30, value: 25 },
  ant:  { last: 44, current: 32, value: 19 },
  eyu:  { last: 53, current: 33, value: 17 },
  koc:  { last: 0, current: 37, value: 30 },
  gen:  { last: 0, current: 34, value: 28 },
  kar:  { last: 0, current: 30, value: 22 }
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Eski sezon ve güncel puanları maç başına normalize eder.
 * Mevcut ağırlıklar korunmuştur: %85 puan performansı, %15 kadro değeri.
 */
export function computePower(
  last: number,
  current: number,
  value: number
): number {
  for (const [label, input] of [
    ['last', last],
    ['current', current],
    ['value', value]
  ] as const) {
    if (!Number.isFinite(input) || input < 0) {
      throw new Error(`${label} negatif olmayan sonlu sayı olmalı: ${input}`);
    }
  }

  let pointsPower: number;

  if (last > 0) {
    const lastPerMatch = last / 36;
    const currentPerMatch = current / 34;
    pointsPower = (lastPerMatch * 0.5 + currentPerMatch * 0.5) / 2.8;
  } else {
    // Önceki sezon verisi olmayan takıma uygulanan mevcut %10 katsayı korunur.
    pointsPower = (current / 34) / 2.8 * 0.9;
  }

  const valuePower = clamp(value / 337, 0, 1);
  return clamp(pointsPower * 0.85 + valuePower * 0.15, 0, 1);
}

function buildTeamPower(
  id: string,
  data: RawTeamPower
): TeamPower {
  const power = computePower(data.last, data.current, data.value);

  return {
    id,
    name: id.toUpperCase(),
    power: Math.round(power * 1000) / 1000,
    attackStrength: Math.round(power * 100) / 100,
    defenseStrength: Math.round((power * 0.9 + 0.1) * 100) / 100,
    lastSeasonPts: data.last,
    currentPts: data.current,
    squadValue: data.value
  };
}

export const TEAM_POWERS: Record<string, TeamPower> = {};

for (const [id, data] of Object.entries(RAW)) {
  TEAM_POWERS[id] = buildTeamPower(id, data);
}
