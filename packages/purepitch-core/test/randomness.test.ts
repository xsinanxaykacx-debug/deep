import { describe, expect, it } from 'vitest';
import { SeededRandomProvider } from './golden/fixture.js';

describe('SeededRandomProvider — deterministik stream ayrımı', () => {
  it('aynı master seed ve tick aynı AI RNG dizisini üretir', () => {
    const first = new SeededRandomProvider(12345).forAI(10);
    const second = new SeededRandomProvider(12345).forAI(10);
    expect(Array.from({ length: 100 }, () => first.next())).toEqual(Array.from({ length: 100 }, () => second.next()));
  });
  it('farklı tick farklı AI RNG dizisi üretir', () => {
    const provider = new SeededRandomProvider(12345);
    const tick10 = provider.forAI(10);
    const tick11 = provider.forAI(11);
    expect(Array.from({ length: 8 }, () => tick10.next())).not.toEqual(Array.from({ length: 8 }, () => tick11.next()));
  });
  it('aynı tick içindeki AI ve event streamleri birbirinden ayrıdır', () => {
    const provider = new SeededRandomProvider(12345);
    const ai = provider.forAI(10);
    const events = provider.forEvents(10);
    expect(Array.from({ length: 8 }, () => ai.next())).not.toEqual(Array.from({ length: 8 }, () => events.next()));
  });
  it('physics stream API uyumluluğu için deterministiktir, motor tarafından tüketilmez', () => {
    const first = new SeededRandomProvider(12345).forPhysics(10);
    const second = new SeededRandomProvider(12345).forPhysics(10);
    expect(Array.from({ length: 8 }, () => first.next())).toEqual(Array.from({ length: 8 }, () => second.next()));
  });
});
