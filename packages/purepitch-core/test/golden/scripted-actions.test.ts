import { describe, expect, it } from 'vitest';
import { runScenario } from './runScenario.js';
import { FIXTURE_SEED, INTENT_SEED } from './fixture.js';

describe('Golden senaryosu — scripted pas', () => {
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
