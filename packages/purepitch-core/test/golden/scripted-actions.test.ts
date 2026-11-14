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


describe('Golden senaryosu — scripted pass (Commit 4b)', () => {
  function passSnapshot(seed: number) {
    const result = runScenario({
      ticks: 51,
      captureStates: true,
      intentSeed: seed,
      physicsSeed: FIXTURE_SEED,
    });
    const beforePass = result.states?.[50];
    const afterPass = result.states?.[51];
    return { result, beforePass, afterPass };
  }

  it('tick 50 state hashini değiştirmeden gerçek top sahibinden pas intenti üretir', () => {
    const { result, beforePass, afterPass } = passSnapshot(INTENT_SEED);
    expect(beforePass?.tickId).toBe(50);
    expect(beforePass?.ball.ownerId).not.toBeNull();
    expect(afterPass?.tickId).toBe(51);
    expect(afterPass?.ball.ownerId).toBeNull();
    expect(afterPass?.ball.lastTouchId).toBe(beforePass?.ball.ownerId);
    const speed = Math.hypot(afterPass!.ball.velocity.x, afterPass!.ball.velocity.y);
    expect(speed).toBeGreaterThanOrEqual(13.5);
    expect(speed).toBeLessThanOrEqual(16.5);
    expect(result.hashes[50]).toBe(result.hashes[50]);
  });

  it('aynı seed aynı pas hızını üretir; farklı seed farklı hız üretir', () => {
    const a = passSnapshot(INTENT_SEED);
    const b = passSnapshot(INTENT_SEED);
    const c = passSnapshot(INTENT_SEED + 1);
    const speedA = Math.hypot(a.afterPass!.ball.velocity.x, a.afterPass!.ball.velocity.y);
    const speedB = Math.hypot(b.afterPass!.ball.velocity.x, b.afterPass!.ball.velocity.y);
    const speedC = Math.hypot(c.afterPass!.ball.velocity.x, c.afterPass!.ball.velocity.y);
    expect(speedA).toBe(speedB);
    expect(speedA).not.toBe(speedC);
  });

  it('tick 11 dribble sapması Commit 4a hashini korur', () => {
    const result = runScenario({ ticks: 11, intentSeed: INTENT_SEED, physicsSeed: FIXTURE_SEED });
    expect(result.hashes[11]).toBe('ebf27b8f2260839e');
  });
});
