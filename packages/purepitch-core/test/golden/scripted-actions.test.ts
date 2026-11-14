import { describe, expect, it } from 'vitest';
import { runScenario } from './runScenario.js';
import { FIXTURE_SEED, INTENT_SEED } from './fixture.js';

describe('Golden senaryosu — scripted dribble (Commit 4a)', () => {
  it('tick 10 intenti tick 11 snapshotında başarılı dribble olarak görünür', () => {
    const result = runScenario({
      ticks: 11,
      captureStates: true,
      intentSeed: INTENT_SEED,
      physicsSeed: FIXTURE_SEED,
    });
    const beforeDribble = result.states?.[10];
    const afterDribble = result.states?.[11];

    expect(beforeDribble?.tickId).toBe(10);
    expect(beforeDribble?.ball.ownerId).toBe('home_9');
    expect(afterDribble?.tickId).toBe(11);
    expect(afterDribble?.ball.ownerId).toBeNull();
    expect(afterDribble?.ball.lastTouchId).toBe('home_9');
    expect(afterDribble?.ball.controlStrength).toBe(0.8);
    expect(Math.hypot(afterDribble!.ball.velocity.x, afterDribble!.ball.velocity.y)).toBeCloseTo(5, 8);
    expect(afterDribble?.ball.dribbleUntilTick).toBe(40);
  });

  it('dribble penceresi tick 39 dahil aktif, tick 40 itibarıyla pasiftir', () => {
    const result = runScenario({
      ticks: 40,
      captureStates: true,
      intentSeed: INTENT_SEED,
      physicsSeed: FIXTURE_SEED,
    });
    const tick39 = result.states?.[39];
    const tick40 = result.states?.[40];

    expect(tick39?.tickId).toBe(39);
    expect(tick39?.ball.dribbleUntilTick).toBe(40);
    expect(tick39?.ball.lastTouchId).toBe('home_9');

    expect(tick40?.tickId).toBe(40);
    expect(tick40?.ball.dribbleUntilTick).toBe(40);
    expect(tick40!.tickId < tick40!.ball.dribbleUntilTick).toBe(false);
    expect(tick40?.ball.lastTouchId).toBeFalsy();
  });

  it('aynı seed aynı tick-tick dribble hash dizisini üretir', () => {
    const a = runScenario({ ticks: 80, intentSeed: INTENT_SEED, physicsSeed: FIXTURE_SEED });
    const b = runScenario({ ticks: 80, intentSeed: INTENT_SEED, physicsSeed: FIXTURE_SEED });
    expect(a.hashes).toEqual(b.hashes);
  });
});
