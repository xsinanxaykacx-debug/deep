import { describe, expect, it } from 'vitest';
import { createFixtureState, createScriptedIntents, SeededRandom } from './fixture.js';

function getScriptedDribble(seed: number): { direction: number; success: boolean } {
  const state = createFixtureState();
  const intent = createScriptedIntents(state, 10, new SeededRandom(seed)).get('home_9');
  if (!intent || intent.kind !== 'dribble') {
    throw new Error('Tick 10 scripted dribble intent üretilmedi.');
  }
  return { direction: intent.dribbleDirection, success: intent.success };
}

describe('scripted dribble — RNG tüketmeden deterministik intent', () => {
  it('dribble kararı farklı RNG seed değerlerinden etkilenmez', () => {
    expect(getScriptedDribble(100)).toEqual(getScriptedDribble(200));
  });

  it('senaryo tick 10 için başarılı dribble üretir', () => {
    expect(getScriptedDribble(0xBADC0DE)).toEqual({ direction: 0, success: true });
  });
});
