# PurePitch Core

This package is isolated from the FM27 root application and its root build configuration.

## Baseline

- `src/purepitch_v3.ts`: shared contracts and v3 data types.
- `src/PurePhysicsEngine.ts`: the v4 physics implementation copied from the conversation baseline.
- Golden tests will pin the current behavior before corrective physics work begins.

## Commands

Run these commands from this directory:

```bash
npm ci
npm run build
npm run test:golden
```

The golden-master update command must only be run after repeatability has been verified.

## Known baseline limitations

The v4 source intentionally retains known issues for baseline testing: readonly tick cast, untyped optional facing/strength access, no action execution, and physics coefficients that still require calibration. A matching golden hash proves repeatability, not physical correctness.


## Golden determinism tests

The golden suite verifies repeatability for the same fixture and seeds on the same
Node.js version and CPU architecture. It does **not** prove that the simulated
physics is realistic or correct.

It does not validate energy or momentum conservation, acceleration curves,
expected-goals calibration, or football decision quality. Those require separate
physics and gameplay validation suites before a v5 engine can be considered sound.

The initial determinism run may be executed before a golden master exists. The package runtime is pinned to Node.js 22.23.4, and dependency installation uses the committed npm lockfile. `npm audit --audit-level=high` is part of CI. The
golden-master regression tests are skipped until
`test/golden/golden-master.json` is committed. Generate that file explicitly
with `npm run golden:update` only after two independent scenario runs match.


## Double-buffer sözleşmesi

`PlayerState.position`, `velocity`, `facing` ve `stamina` tick sırasında güncellenen
state alanlarıdır. `attributes` ve `roleAnchor` ise immutable kabul edilir:

- `PlayerAttributes` alanları `readonly` olarak tanımlıdır.
- `roleAnchor`, `Readonly<Vector2D>` olarak tanımlıdır; koordinatları yerinde değiştirilemez.
- Fizik motoru bu iki alanı hiçbir tick'te mutasyona uğratmaz. Buffer oluşturucu bunlar için
  current/next arasında referans paylaşabilir.
- Gelecekte oyuncu niteliği veya rol çapası değişecekse mevcut nesne mutate edilmez;
  yeni bir nesne oluşturulup ilgili state'e atanır.

Bu sözleşme, double-buffer state'inin tick'ler arasında sessizce geriye dönük
değişmesini önler. Golden determinism testi tek başına bu immutability garantisini
kanıtlamaz; garanti TypeScript tipleri ve motorun yazma sınırıyla korunur.
