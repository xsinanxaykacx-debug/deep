# Golden Test — Teknik Düzeltmeler ve Uygulama Notları

Durum: Kaydedilmiş teknik tasarım; henüz çalışan test kodu değildir.
Tarih: 2026-11-14

Bu notlar PurePhysicsEngine v4 için konuşmada verilen ek teknik düzeltmeleri kaydeder. FM27 kök yapılandırmasına dokunulmaz.

## Repo araştırması

Araştırılan depo: `xsinanxaykacx-debug/deep`

- `main` commit: `1be2cd871bdc392461fcd1be33291b22212ef9df`
- Kaynak ağacında `match.ts`, `core.ts`, `player.ts`, `pitch.ts`, `rules.ts` gibi FM27 dosyaları bulunuyor.
- `src/PurePhysicsEngine.ts`, `src/purepitch_v3.ts`, `src/purepitch_v3/index.ts` bulunmuyor.
- Mevcut dalların listesinde `purepitch` adlı ayrı bir dal görünmüyor.
- Kök `package.json` FM27 projesine ait; bu nedenle kök test altyapısı veya bağımlılıkları değiştirilmemeli.

Koruma dalı: `backup/main-before-pure-physics-golden-2026-11-14`

## 1. Gerçek FNV-1a 64-bit

Aşağıdaki 32-bit parçalı çarpım, 64-bit FNV-1a'nın mod 2^64 aritmetiğini uygular. `lo * 0x1b3` ve üst kelime hesabı Number'ın tam tamsayı aralığında kalır.

```ts
const FNV_OFFSET_BASIS_LO = 0x84222325;
const FNV_OFFSET_BASIS_HI = 0xcbf29ce4;
const FNV_PRIME_LO = 0x000001b3;
const FNV_PRIME_HI = 0x00000100;

export function fnv1a64(bytes: Uint8Array): string {
  let lo = FNV_OFFSET_BASIS_LO >>> 0;
  let hi = FNV_OFFSET_BASIS_HI >>> 0;

  for (let i = 0; i < bytes.length; i++) {
    lo = (lo ^ bytes[i]) >>> 0;

    const loProduct = lo * FNV_PRIME_LO;
    const nextLo = loProduct >>> 0;
    const carry = Math.floor(loProduct / 0x100000000) >>> 0;

    const nextHi = (
      hi * FNV_PRIME_LO +
      lo * FNV_PRIME_HI +
      carry
    ) >>> 0;

    lo = nextLo;
    hi = nextHi;
  }

  return hi.toString(16).padStart(8, '0') +
    lo.toString(16).padStart(8, '0');
}
```

Bilinen test vektörü: UTF-8 `hello` girdisi için sonuç `a430d84680aabd0b` olmalıdır.

### State byte serialization kuralları

- Float64 değerleri sabit endian ile DataView üzerinden byte'a çevrilir.
- `+0` ve `-0` farklı kalır.
- NaN tek bir canonical bit desenine normalize edilir.
- String kodlama ve uzunluk prefix'i sabittir.
- Alan sırası açıkça tanımlanır; Map iteration sırasına güvenilmez.
- Hash'e tüm deterministik state dahil edilir: tick, topun konum/hız/spin/sahiplik/kontrol verileri, playerOrder, oyuncu kimlikleri, takım kimlikleri, pozisyon, hız, stamina, facing, roleAnchor, tüm fiziksel attribute'lar ve simülasyonun değiştirdiği diğer alanlar.
- Eksik oyuncu, yinelenen playerOrder girdisi ve playerOrder dışında kalan Map girdileri sessizce yutulmaz; fixture/state doğrulaması hata verir.

Önemli: Konuşmada verilen örnek `stateToBytes` yalnızca mevcut alanlardan bir alt kümesini gösterir. Gerçek `MatchState` ve `PlayerState` tipleri görülmeden final serializer olarak kullanılmamalıdır. `facing` alanı gerçek tipe eklenmeli; `as { facing?: number }` cast'i kalıcı çözüm değildir.

## 2. ESM uyumlu golden master okuma

Vitest/ESM testinde CommonJS `require` kullanılmaz. Node dosya API'si ve `import.meta.url` kullanılabilir:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface GoldenMaster {
  readonly hashes: readonly string[];
  readonly tickCount: number;
}

const masterPath = fileURLToPath(
  new URL('./golden-master.json', import.meta.url)
);

const master = JSON.parse(
  readFileSync(masterPath, 'utf8')
) as GoldenMaster;
```

## 3. Tick bazlı snapshot ve ilk sapma raporu

`runScenario` her tick hash'ini saklar. Ayrıntılı modda her tick'in state snapshot'ını da saklar. Snapshot'lar mutable engine buffer'larına referans olmamalı; deep clone veya immutable serialized representation olmalıdır.

```ts
export interface ScenarioConfig {
  readonly ticks: number;
  readonly intentSeed: number;
  readonly engineConfig?: Partial<PhysicsConfig>;
  readonly captureStates?: boolean;
}

export interface ScenarioResult {
  readonly hashes: readonly string[];
  readonly states: readonly MatchState[] | null;
  readonly finalState: MatchState;
}
```

Karşılaştırma, hash dizisi uzunluk farkını da kontrol etmelidir:

```ts
export function compareRuns(a: ScenarioResult, b: ScenarioResult): void {
  const sharedLength = Math.min(a.hashes.length, b.hashes.length);

  for (let tick = 0; tick < sharedLength; tick++) {
    if (a.hashes[tick] !== b.hashes[tick]) {
      const lines = [
        `İlk sapma tick index: ${tick}`,
        `Run A: ${a.hashes[tick]}`,
        `Run B: ${b.hashes[tick]}`,
      ];

      if (tick > 0) {
        lines.push(`Önceki tick A: ${a.hashes[tick - 1]}`);
        lines.push(`Önceki tick B: ${b.hashes[tick - 1]}`);
      }

      if (a.states && b.states) {
        const diffs = diffState(a.states[tick], b.states[tick]);
        lines.push(`State farkı sayısı: ${diffs.length}`);
        for (const diff of diffs) {
          lines.push(`  ${diff.field}: ${diff.prev} → ${diff.next}`);
        }
      } else {
        lines.push('Ayrıntılı state farkı için captureStates=true ile yeniden çalıştır.');
      }

      throw new Error(lines.join('\n'));
    }
  }

  if (a.hashes.length !== b.hashes.length) {
    throw new Error(
      `Tick sayısı farklı: Run A=${a.hashes.length}, Run B=${b.hashes.length}`
    );
  }
}
```

### Double-buffer zorunluluğu

Senaryo koşucusu her tick sonunda current ve next buffer referanslarını gerçekten değiştirmelidir. Aynı state nesnesini bir sonraki tick'te hem source hem target olarak kullanmak, double-buffer izolasyonunu bozar. Test öncesi current-state hash'i step sonrasında değişmemelidir.

### Ayrıntılı yeniden koşu

Normal testte `captureStates: false` kullanılabilir. İlk sapma saptanırsa aynı fixture, seed, intent ve config ile iki koşu `captureStates: true` olarak yeniden çalıştırılır. Snapshot alımı state referansını değil, derin kopyayı saklar.

## 4. İzole paket önerisi

PurePitch kaynaklarının yeri doğrulanmadan bu yapı oluşturulmaz. Doğrulandıktan sonra önerilen yapı:

```text
packages/
  purepitch-core/
    package.json
    tsconfig.json
    vitest.config.ts
    src/
    test/
      golden/
    scripts/
```

Paketin kendi `package.json`, `tsconfig.json` ve `vitest.config.ts` dosyaları olur. FM27 kök `package.json`, `tsconfig.json`, `src/` veya mevcut motor dosyaları değiştirilmez.

Önerilen test bağımlılıkları ve script'ler, gerçek Node/TypeScript sürümü doğrulandıktan sonra eklenir. Özellikle `node --experimental-strip-types` komutu Node sürümüne bağlı olduğundan, script çalıştırma biçimi tahmin edilmez.

## 5. Açık kalan doğrulamalar

1. PurePhysicsEngine v4 tam kaynak kodu ve gerçek tipler henüz bu repoda tespit edilmedi.
2. `stateToBytes` serializer tüm mutable/deterministik alanları kapsayacak şekilde gerçek tiplere göre tamamlanmalı.
3. FNV-1a 64-bit implementasyonu bilinen test vektörleriyle doğrulanmalı.
4. Golden master üretimi ayrı, açık bir komut olmalı; testler master dosyasını otomatik güncellememeli.
5. İlk golden master yalnızca iki bağımsız koşunun tick hash'leri birebir eşleştiğinde oluşturulmalı.
6. v4 kaynakları bulunmadan v5 fizik değişikliklerine veya FM27 motoruna müdahale edilmemeli.
