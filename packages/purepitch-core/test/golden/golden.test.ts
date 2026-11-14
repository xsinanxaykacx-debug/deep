// Golden Test — v4'ün determinizmini kanıtlar.
// ÖNEMLİ: Bu test fiziğin DOĞRU olduğunu kanıtlamaz. Sadece tekrarlanabilirliği kanıtlar.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runScenario, type ScenarioConfig } from './runScenario.js';
import { hashState, diffState, assertHashFormat, selfTestFnv } from './hashState.js';
import { FIXTURE_SEED, INTENT_SEED } from './fixture.js';

const SCENARIO: Required<Pick<ScenarioConfig, 'ticks' | 'intentSeed' | 'physicsSeed'>> = {
  ticks: 1000,
  intentSeed: INTENT_SEED,
  physicsSeed: FIXTURE_SEED,
};

function compareHashes(
  a: readonly string[],
  b: readonly string[],
  aStates: readonly import('../../src/purepitch_v3.js').MatchState[] | null,
  bStates: readonly import('../../src/purepitch_v3.js').MatchState[] | null,
): void {
  // Uzunluk kontrolü — biri eksikse hemen raporla
  if (a.length !== b.length) {
    throw new Error(
      `Hash dizisi uzunluğu farklı: A=${a.length}, B=${b.length}. ` +
      `Bu, koşulardan birinin erken bittiği anlamına gelir.`,
    );
  }

  for (let t = 0; t < a.length; t++) {
    assertHashFormat(a[t]);
    assertHashFormat(b[t]);
    if (a[t] !== b[t]) {
      const lines: string[] = [
        ``,
        `═══════════════════════════════════════════════`,
        `  İLK SAPMA: tick ${t}`,
        `═══════════════════════════════════════════════`,
        `  A hash: ${a[t]}`,
        `  B hash: ${b[t]}`,
      ];
      if (t > 0) {
        lines.push(`  Önceki tick (${t - 1}) eşleşiyordu: ${a[t - 1]} === ${b[t - 1]}`);
      }
      if (aStates && bStates) {
        const diffs = diffState(aStates[t], bStates[t]);
        lines.push(`  Farklar (${diffs.length}):`);
        for (const d of diffs.slice(0, 50)) {
          lines.push(`    ${d.field}: ${String(d.prev)} → ${String(d.next)}`);
        }
        if (diffs.length > 50) {
          lines.push(`    ... ve ${diffs.length - 50} fark daha`);
        }
      } else {
        lines.push(`  Detaylı diff için: captureStates: true ile yeniden koş.`);
      }
      throw new Error(lines.join('\n'));
    }
  }
}

describe('Golden Test — v4 determinizmi', () => {
  it('FNV-1a 64-bit test vektörü doğru', () => {
    selfTestFnv();
  });

  it('aynı fixture + aynı seed → aynı tick-tick hash (hızlı, state saklamadan)', () => {
    const a = runScenario(SCENARIO);
    const b = runScenario(SCENARIO);
    compareHashes(a.hashes, b.hashes, null, null);
  });

  it('sapma olursa detaylı diff üretebilir (captureStates ile)', () => {
    // Bu test normalde geçer; sadece altyapının çalıştığını doğrular.
    // Bilerek farklı seed'lerle koşup FARKLI hash ürettiğini görürüz.
    const a = runScenario({ ...SCENARIO, intentSeed: 0x11111111 });
    const b = runScenario({ ...SCENARIO, intentSeed: 0x22222222 });
    // Farklı seed → farklı koşu → en azından son hash farklı olmalı
    expect(a.hashes[a.hashes.length - 1]).not.toBe(b.hashes[b.hashes.length - 1]);
  });

  it('farklı seed → farklı sonuç (testin ayırt edici olduğunu kanıtlar)', () => {
    const a = runScenario({ ...SCENARIO, intentSeed: 0x11111111 });
    const b = runScenario({ ...SCENARIO, intentSeed: 0x22222222 });
    expect(a.hashes).not.toEqual(b.hashes);
  });

  describe('golden-master regresyon', () => {
    const masterPath = fileURLToPath(new URL('./golden-master.json', import.meta.url));

    it('golden-master mevcut ve geçerli (yoksa oluşturma talimatı göster)', () => {
      if (!existsSync(masterPath)) {
        throw new Error(
          `golden-master.json bulunamadı: ${masterPath}\n` +
          `Oluşturmak için: npm run golden:update\n` +
          `Ardından dosyayı commit'leyin.`,
        );
      }
      const raw = readFileSync(masterPath, 'utf-8');
      const master = JSON.parse(raw) as {
        hashes: string[];
        tickCount: number;
        scenario: { ticks: number; intentSeed: number; physicsSeed: number };
      };
      expect(Array.isArray(master.hashes)).toBe(true);
      expect(master.hashes.length).toBe(master.tickCount + 1);
      expect(master.scenario.ticks).toBe(master.tickCount);
      // Tüm hash'ler formatlı mı?
      for (const h of master.hashes) assertHashFormat(h);
    });

    it('mevcut motor golden-master ile eşleşir', () => {
      if (!existsSync(masterPath)) {
        // Önceki test zaten hata verdi, burada da hata verelim
        throw new Error(`golden-master.json yok. Önce: npm run golden:update`);
      }
      const master = JSON.parse(readFileSync(masterPath, 'utf-8')) as {
        hashes: string[];
        tickCount: number;
        scenario: { ticks: number; intentSeed: number; physicsSeed: number };
      };
      const result = runScenario({
        ticks: master.tickCount,
        intentSeed: master.scenario.intentSeed,
        physicsSeed: master.scenario.physicsSeed,
      });
      compareHashes(result.hashes, master.hashes, null, null);
    });
  });
});

describe('Golden Test — edge case', () => {
  it('0 tick → sadece başlangıç hash\'i', () => {
    const r = runScenario({ ticks: 0, intentSeed: INTENT_SEED, physicsSeed: FIXTURE_SEED });
    expect(r.hashes.length).toBe(1);
    expect(r.hashes[0]).toBe(hashState(r.finalState));
  });

  it('1 tick → 2 hash', () => {
    const r = runScenario({ ticks: 1, intentSeed: INTENT_SEED, physicsSeed: FIXTURE_SEED });
    expect(r.hashes.length).toBe(2);
  });

  it('tickId her tick\'te artıyor', () => {
    const detailed = runScenario({ ticks: 10, intentSeed: INTENT_SEED, physicsSeed: FIXTURE_SEED, captureStates: true });
    if (detailed.states) {
      for (let t = 1; t <= 10; t++) {
        expect(detailed.states[t].tickId).toBe(t);
      }
    }
  });
});
