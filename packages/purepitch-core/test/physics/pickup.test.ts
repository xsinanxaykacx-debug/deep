import { describe, expect, it } from 'vitest';
import { PurePhysicsEngine } from '../../src/PurePhysicsEngine.js';
import type { IRandomSource } from '../../src/purepitch_v3.js';
import { makeBall, makeEmptyState, makePlayer } from './setup.js';

const DT = 1 / 60;
const noRng: IRandomSource = {
  next: () => 0.5,
  nextUint32: () => 0x80000000
};
const noIntents = new Map();

describe('pickup — deterministik top kontrolü', () => {
  it('temas mesafesindeki oyuncu serbest topu alır', () => {
    const player = makePlayer('home_1', 'home', { x: 0.3, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([player], ball);
    const next = makeEmptyState([player], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT, noRng);

    expect(next.ball.ownerId).toBe('home_1');
    expect(next.ball.controlStrength).toBe(1);
    expect(next.ball.position.x).toBeCloseTo(next.players.get('home_1')!.position.x, 10);
    expect(next.ball.position.y).toBeCloseTo(next.players.get('home_1')!.position.y, 10);
    expect(next.ball.position.z).toBe(0.1);
  });

  it('temas mesafesi dışındaki oyuncu topu alamaz', () => {
    const player = makePlayer('home_1', 'home', { x: 1, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([player], ball);
    const next = makeEmptyState([player], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT, noRng);

    expect(next.ball.ownerId).toBeNull();
  });

  it('temas alanındaki oyuncu, alan dışındaki daha uzak oyuncuya karşı topu alır', () => {
    const near = makePlayer('home_1', 'home', { x: 0.2, y: 0 });
    const far = makePlayer('away_1', 'away', { x: 1.5, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([near, far], ball);
    const next = makeEmptyState([near, far], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT, noRng);

    expect(next.ball.ownerId).toBe('home_1');
  });

  it('eşit mesafede playerOrder sırasındaki ilk oyuncu kazanır', () => {
    const first = makePlayer('home_1', 'home', { x: 0.3, y: 0 });
    const second = makePlayer('away_1', 'away', { x: -0.3, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([first, second], ball);
    const next = makeEmptyState([first, second], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT, noRng);

    expect(next.ball.ownerId).toBe('home_1');
  });

  it('top zaten sahipliyse pickup başka oyuncuya geçirmez', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const challenger = makePlayer('away_1', 'away', { x: 0.8, y: 0 });
    const ball = makeBall({ ownerId: 'home_1', position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([owner, challenger], ball);
    const next = makeEmptyState([owner, challenger], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT, noRng);

    expect(next.ball.ownerId).toBe('home_1');
  });

  it('top havadaysa z 0.5 metrenin üzerindeyken pickup yapılmaz', () => {
    const player = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 1 } });
    const current = makeEmptyState([player], ball);
    const next = makeEmptyState([player], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT, noRng);

    expect(next.ball.ownerId).toBeNull();
  });
});
