import { describe, expect, it } from 'vitest';
import { runScenario } from './runScenario.js';
import { createFixtureState, createScriptedIntents, SeededRandomProvider, FIXTURE_SEED, INTENT_SEED } from './fixture.js';

describe('Golden senaryosu — scripted pas', () => {
  const scriptedPassSpeed = (seed: number): number => {
    const state = createFixtureState();
    const rng = new SeededRandomProvider(seed).forAI(10);
    const intent = createScriptedIntents(state, 10, rng).get('home_9');
    if (!intent || intent.kind !== 'pass') throw new Error('Scripted pass intent üretilmedi');
    return intent.passSpeed;
  };

  it('aynı seed aynı pas hızını, farklı seed farklı pas hızını üretir', () => {
    const first = scriptedPassSpeed(INTENT_SEED);
    const repeated = scriptedPassSpeed(INTENT_SEED);
    const different = scriptedPassSpeed(INTENT_SEED + 1);
    expect(repeated).toBe(first);
    expect(different).not.toBe(first);
  });

  it('seedli pas hızı 13.5–16.5 m/s aralığındadır', () => {
    for (const seed of [INTENT_SEED, INTENT_SEED + 1, 0x12345678, 0xdeadbeef]) {
      const speed = scriptedPassSpeed(seed);
      expect(speed).toBeGreaterThanOrEqual(13.5);
      expect(speed).toBeLessThan(16.5);
    }
  });
  it('tick 10 aksiyonu sonraki state tick 11’de home_9 topu serbest bırakır', () => {
    const result = runScenario({
      ticks: 11,
      captureStates: true,
      intentSeed: INTENT_SEED,
      physicsSeed: FIXTURE_SEED
    });
    const afterPass = result.states?.[11];
    expect(afterPass).toBeDefined();
    expect(afterPass?.tickId).toBe(11);
    expect(afterPass?.ball.ownerId).toBeNull();
    const passSpeed = Math.hypot(afterPass!.ball.velocity.x, afterPass!.ball.velocity.y);
    expect(passSpeed).toBeGreaterThanOrEqual(13.5);
    expect(passSpeed).toBeLessThan(16.5);
  });

  it('pas sonrası serbest top ilerler ve hedef oyuncu home_10 topu alır', () => {
    const result = runScenario({
      ticks: 120,
      captureStates: true,
      // Bu seed, ±%10 aralıktaki pas hızlarından alıcının yetişebildiği bir örneği sabitler.
      intentSeed: INTENT_SEED + 1,
      physicsSeed: FIXTURE_SEED
    });
    const states = result.states ?? [];
    const firstPickup = states.slice(12).find((state) => state.ball.ownerId !== null);
    expect(firstPickup?.ball.ownerId).toBe('home_10');
  });
});
