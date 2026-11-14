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
