// Golden master'ı güncelle — sadece kasıtlı davranış değişikliğinde çalıştır.
// Kullanım: npm run golden:update
// UYARI: Bu, mevcut motorun "gerçeği" olduğunu kabul eder.
//        Fizik doğruluğu iddiası DEĞİLDİR.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runScenario } from '../test/golden/runScenario.js';
import { FIXTURE_SEED, INTENT_SEED } from '../test/golden/fixture.js';

const SCENARIO = {
  ticks: 1000,
  intentSeed: INTENT_SEED,
  physicsSeed: FIXTURE_SEED,
} as const;

const result = runScenario(SCENARIO);
const outPath = fileURLToPath(new URL('../test/golden/golden-master.json', import.meta.url));

writeFileSync(
  outPath,
  JSON.stringify(
    {
      _comment: "PurePitch v6-2 Commit 4b golden master — tick 10 dribble, 30 tick pickup penceresi ve tick 50 gerçek sahipten RNG hızlı pas dahil. Fizik doğruluğu iddiası değildir.",
      _generatedAt: new Date().toISOString(),
      _engine: 'PurePhysicsEngine v6-2-Commit-4b',
      _note: 'v6-2 Commit 4b: tick 10 dribble + tick 50 gerçek sahipten scripted pass. Kasıtlı davranış değişikliğinde bu dosya yenilenir.',
      scenario: SCENARIO,
      tickCount: SCENARIO.ticks,
      hashes: result.hashes,
    },
    null,
    2,
  ),
);

console.log(`Golden master yazıldı: ${outPath}`);
console.log(`Tick sayısı: ${SCENARIO.ticks}`);
console.log(`Hash sayısı: ${result.hashes.length} (beklenen: ${SCENARIO.ticks + 1})`);
console.log(`Başlangıç hash: ${result.hashes[0]}`);
console.log(`Son hash:      ${result.hashes[result.hashes.length - 1]}`);
