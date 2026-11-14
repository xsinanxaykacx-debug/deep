let _seed = normalizeSeed(Date.now());

function normalizeSeed(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Seed sonlu bir sayı olmalı: ${value}`);
  }

  const integer = Math.trunc(value);
  const normalized = ((integer % 2147483647) + 2147483647) % 2147483647;
  return normalized || 1;
}

/** Tekrarlanabilir simülasyonlar için PRNG başlangıç değerini ayarlar. */
export function seed(value: number): void {
  _seed = normalizeSeed(value);
}

/** Park-Miller (minimal standard) sözde rastgele sayı üreteci. */
export function rand(): number {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}

export function rng(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error(`rng(max): max pozitif tam sayı olmalı: ${max}`);
  }

  return Math.floor(rand() * max);
}

export function pick<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pick(): boş listeden seçim yapılamaz.');
  }

  return items[rng(items.length)];
}

export function chance(probability: number): boolean {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new Error(
      `chance(p): olasılık 0-1 arasında olmalı: ${probability}`
    );
  }

  return rand() < probability;
}

/**
 * İki gücü karşılaştırır.
 * floor, sonucun hiçbir zaman 0 veya 1 olmasını engelleyen alt/üst sınırdır.
 */
export function roll(
  attack: number,
  defense: number,
  floor = 0.15
): boolean {
  if (!Number.isFinite(attack) || !Number.isFinite(defense)) {
    throw new Error('roll(): hücum ve savunma güçleri sonlu sayı olmalı.');
  }

  if (!Number.isFinite(floor) || floor < 0 || floor > 0.5) {
    throw new Error(`roll(): floor 0-0.5 arasında olmalı: ${floor}`);
  }

  const difference = attack - defense;
  const probability = Math.max(
    floor,
    Math.min(1 - floor, 0.5 + difference * 0.04)
  );

  return rand() < probability;
}
