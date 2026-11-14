import { describe, expect, it } from 'vitest';
import { createFixtureState, createScriptedIntents, SeededRandom } from './fixture.js';

function getScriptedPassSpeed(seed: number): number {
  const state = createFixtureState();
  const intent = createScriptedIntents(state, 10, new SeededRandom(seed)).get('home_9');
  if (!intent || intent.kind !== 'pass') {
    throw new Error('Tick 10 scripted pass intent üretilmedi.');
  }
  return intent.passSpeed;
}

describe('scripted pass RNG — seed determinismi', () => {
  it('aynı seed aynı pas hızını üretir', () => {
    expect(getScriptedPassSpeed(100)).toBe(getScriptedPassSpeed(100));
  });

  it('farklı seed farklı pas hızı üretebilir', () => {
    expect(getScriptedPassSpeed(100)).not.toBe(getScriptedPassSpeed(200));
  });

  it('pas hızı 13.5 dahil, 16.5 hariç m/s aralığındadır', () => {
    const speed = getScriptedPassSpeed(0xBADC0DE);
    expect(speed).toBeGreaterThanOrEqual(13.5);
    expect(speed).toBeLessThan(16.5);
  });
});
