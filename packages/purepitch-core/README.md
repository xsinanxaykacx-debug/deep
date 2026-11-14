# PurePitch Core

This package is isolated from the FM27 root application and its root build configuration.

## Baseline

- `src/purepitch_v3.ts`: shared contracts and v3 data types.
- `src/PurePhysicsEngine.ts`: the v4 physics implementation copied from the conversation baseline.
- Golden tests will pin the current behavior before corrective physics work begins.

## Commands

Run these commands from this directory:

```bash
npm install
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

The initial determinism run may be executed before a golden master exists. The
golden-master regression tests are skipped until
`test/golden/golden-master.json` is committed. Generate that file explicitly
with `npm run golden:update` only after two independent scenario runs match.
