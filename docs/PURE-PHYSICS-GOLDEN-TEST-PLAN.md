# PurePhysicsEngine v4 — Golden Test Hazırlık Planı

Durum: TASARIM KAYDI — henüz çalıştırılabilir test değildir.

Bu belge, 2026-11-14 tarihinde konuşmada verilen v4 incelemesi ve Golden Test tasarımını kayda alır. Amaç, v4 motorunun davranışına dokunmadan önce aynı Node.js sürümü ve CPU mimarisinde tekrar üretilebilir tick-tick state hash referansı oluşturmaktır.

## Değişmez ilkeler

1. Golden Test hazırlanırken fizik motorunun kaynak kodu ve davranışı değiştirilmez.
2. Fixture sabit seed'li PRNG kullanır; Math.random() kullanılmaz.
3. Başlangıç state'i ve her tick'in tüm sayısal state alanları sabit sırayla hash'lenir.
4. İki bağımsız engine örneği aynı fixture ve aynı intent akışıyla çalıştırılır.
5. İlk hash sapması tick numarası ve alan bazlı state diff ile raporlanır.
6. Golden master yalnızca v4'ün gerçek kaynak kodu üzerinde test başarılı olduktan sonra üretilir ve commit edilir.
7. Bit düzeyinde çapraz platform garantisi verilmez. Referans ortamı Node.js sürümü ve CPU mimarisiyle birlikte kaydedilir.

## Önerilen dosya yapısı

```text
test/
  golden/
    hashState.ts
    fixture.ts
    runScenario.ts
    golden.test.ts
    golden-master.json
vitest.config.ts
```

## Hash sözleşmesi

- Float değerleri DataView üzerinden IEEE-754 64-bit olarak yazılır.
- +0 ve -0 ayrımı korunur.
- NaN tek kanonik bit desenine dönüştürülür.
- String'ler UTF-16 code unit dizisi olarak yazılır.
- Top alanları ve oyuncular playerOrder sırasıyla hash'e katılır.
- Hash algoritması ve byte/field sırası versiyonlanır.
- Hash çıktısı yalnızca kısa bir checksum olmamalı; mümkünse SHA-256 gibi güçlü bir digest veya açıkça belgelenmiş iki bağımsız 32-bit lane kullanılmalıdır. FNV-1a 64-bit deniyorsa gerçekten 64-bit FNV-1a uygulanmalıdır.

## Fixture sözleşmesi

- 11 home + 11 away oyuncu.
- Sabit diziliş anchor'ları ve sabit başlangıç topu.
- Oyuncu özellikleri sabit seed ile üretilir.
- Intent üretimi deterministik ve test PRNG'sinden beslenir.
- Fixture oluşturma her koşuda yeni Map, oyuncu nesneleri, attributes, roleAnchor, position, velocity ve ball nesneleri üretir; koşular arasında mutable referans paylaşılmaz.

## Senaryo koşucusu sözleşmesi

- Her koşu yeni PurePhysicsEngine örneği oluşturur.
- Double-buffer state kopyası derin klonlanır.
- Her tick'te aynı dt ve sabit intent akışı uygulanır.
- Hash başlangıç state'i dahil her tick için kaydedilir.
- Sapma raporu için hash dizisine ek olarak state snapshot'ları veya ilk sapmada yeniden oynatma olanağı tutulur.
- Motorun step imzası gerçek kaynak kodundan okunur; varsayılan imza tahmin edilmez.

## Test grupları

1. Aynı fixture + aynı seed: iki bağımsız koşuda tüm tick hash'leri eşleşmeli.
2. Bağımsız engine örnekleri: sonuçlar eşleşmeli.
3. Golden master regresyonu: referans tick hash'leri eşleşmeli.
4. Diff aracı: kontrollü olarak değiştirilmiş test state'inde doğru alanı raporlamalı.
5. Fixture izolasyonu: iki fixture'ın mutable nesneleri referans paylaşmamalı.
6. Double-buffer izolasyonu: step öncesi current state'in hash'i step sonrası değişmemeli.

## Golden master üretim kuralı

Golden master ilk test koşusunda otomatik ve sessizce yazılmaz. Ayrı, açık bir `--update-golden` komutuyla üretilir. Üretimden önce iki bağımsız koşunun tüm tick hash'lerinin eşleştiği doğrulanır. Dosya; tick sayısı, fixture seed'i, intent seed'i, dt, engine config, Node.js sürümü, platform ve mimari metadata'sını içerir.

Motor davranışını kasıtlı değiştiren v5 gibi bir değişiklikte v4 golden master üzerine yazılmaz. Yeni referans ayrı isimle saklanır (ör. `golden-master-v5.json`) ve değişiklik gerekçesi commit mesajında açıklanır.

## Repo üzerinde tespit edilen engel — 2026-11-14

GitHub `main` dalının kaynak ağacı incelendi. Bu dalda aşağıdaki dosyalar bulunmuyor:

- `src/PurePhysicsEngine.ts`
- `src/purepitch_v3.ts`
- `src/purepitch_v3/index.ts`

Mevcut proje kökünde `match.ts`, `core.ts`, `rules.ts`, `player.ts`, `pitch.ts` gibi FM27 maç motoru dosyaları var; `package.json` içinde Vitest de tanımlı değil.

Bu nedenle konuşmada paylaşılan Golden Test kodu mevcut `main` üzerinde henüz derlenebilir/çalıştırılabilir değildir. Eksik v4 motorunu varsayımla üretmek veya başka motorun tiplerine uyarlayıp v4 testiymiş gibi sunmak doğru değildir.

## Devam şartı

PurePhysicsEngine v4'ün gerçek, tam kaynak dosyaları ve gerçek tip tanımları repoya alındıktan sonra:
1. Motor davranışına dokunmadan test dosyaları gerçek step/API imzasına uyarlanır.
2. Vitest ve TypeScript test yapılandırması eklenir.
3. Test çalıştırılır; başarısızsa ilk sapma raporlanır.
4. Yalnızca iki bağımsız koşu tamamen eşleştiğinde v4 golden master üretilir.
5. Bu aşamaya kadar v5 fiziği/actionType değişikliklerine başlanmaz.
