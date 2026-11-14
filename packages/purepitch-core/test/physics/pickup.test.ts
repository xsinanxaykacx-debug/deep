import { describe, expect, it } from 'vitest';
import { PurePhysicsEngine } from '../../src/PurePhysicsEngine.js';
import { makeBall, makeEmptyState, makePlayer } from './setup.js';

const DT = 1 / 60;
const noIntents = new Map();

describe('pickup — deterministik top kontrolü', () => {
  it('temas mesafesindeki oyuncu serbest topu alır', () => {
    const player = makePlayer('home_1', 'home', { x: 0.3, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([player], ball);
    const next = makeEmptyState([player], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT;

    expect(next.ball.ownerId).toBe('home_1');
    expect(next.ball.controlStrength).toBe(1);
    expect(next.ball.position.x).toBeCloseTo(next.players.get('home_1')!.position.x, 10);
    expect(next.ball.position.y).toBeCloseTo(next.players.get('home_1')!.position.y, 10);
    expect(next.ball.position.z).toBe(0.1);
    expect(next.ball.lastTouchId).toBe('home_1');
  });

  it('temas mesafesi dışındaki oyuncu topu alamaz', () => {
    const player = makePlayer('home_1', 'home', { x: 1, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([player], ball);
    const next = makeEmptyState([player], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT;

    expect(next.ball.ownerId).toBeNull();
  });

  it('temas alanındaki oyuncu, alan dışındaki daha uzak oyuncuya karşı topu alır', () => {
    const near = makePlayer('home_1', 'home', { x: 0.2, y: 0 });
    const far = makePlayer('away_1', 'away', { x: 1.5, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([near, far], ball);
    const next = makeEmptyState([near, far], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT;

    expect(next.ball.ownerId).toBe('home_1');
  });

  it('eşit mesafede playerOrder sırasındaki ilk oyuncu kazanır', () => {
    const first = makePlayer('home_1', 'home', { x: 0.3, y: 0 });
    const second = makePlayer('away_1', 'away', { x: -0.3, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([first, second], ball);
    const next = makeEmptyState([first, second], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT;

    expect(next.ball.ownerId).toBe('home_1');
  });

  it('pası atan oyuncu top ayağından uzaklaşmadan anında yeniden pickup yapamaz', () => {
    const passer = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const ball = makeBall({
      position: { x: 0.2, y: 0, z: 0.1 },
      velocity: { x: 0, y: 0, z: 0 },
      ownerId: null,
      lastTouchId: 'home_1'
    });
    const current = makeEmptyState([passer], ball);
    const next = makeEmptyState([passer], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT;

    expect(next.ball.ownerId).toBeNull();
    expect(next.ball.lastTouchId).toBe('home_1');
  });

  it('top son dokunan oyuncudan pickup yarıçapının dışına çıkınca engel kalkar', () => {
    const passer = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const receiver = makePlayer('home_2', 'home', { x: 0.9, y: 0 });
    const ball = makeBall({
      position: { x: 0.6, y: 0, z: 0.1 },
      velocity: { x: 0, y: 0, z: 0 },
      ownerId: null,
      lastTouchId: 'home_1'
    });
    const current = makeEmptyState([passer, receiver], ball);
    const next = makeEmptyState([passer, receiver], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT;

    expect(next.ball.lastTouchId).toBe('home_2');
    expect(next.ball.ownerId).toBe('home_2');
  });

  it('son dokunan oyuncu yakında olsa bile başka oyuncu serbest topu alabilir', () => {
    const passer = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const receiver = makePlayer('home_2', 'home', { x: 0, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 }, ownerId: null, lastTouchId: 'home_1' });
    const current = makeEmptyState([passer, receiver], ball);
    const next = makeEmptyState([passer, receiver], ball);
    new PurePhysicsEngine().step(current, noIntents, next, DT);
    expect(next.ball.ownerId).toBe('home_2');
    expect(next.ball.lastTouchId).toBe('home_2');
  });

  it('top zaten sahipliyse pickup başka oyuncuya geçirmez', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const challenger = makePlayer('away_1', 'away', { x: 0.8, y: 0 });
    const ball = makeBall({ ownerId: 'home_1', position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([owner, challenger], ball);
    const next = makeEmptyState([owner, challenger], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT;

    expect(next.ball.ownerId).toBe('home_1');
  });

  it('pickup sonrası aynı tick içinde rakip tackle güncel top sahibine uygulanır', () => {
    const ownerCandidate = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const tackler = makePlayer('away_1', 'away', { x: 0.8, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 0.1 } });
    const current = makeEmptyState([ownerCandidate, tackler], ball);
    const next = makeEmptyState([ownerCandidate, tackler], ball);
    const intents = new Map([
      ['away_1', {
        kind: 'tackle' as const,
        targetVelocity: { x: 0, y: 0 },
        sprint: false,
        tackleTargetId: 'home_1'
      }]
    ]);

    new PurePhysicsEngine().step(current, intents, next, DT;

    expect(next.ball.ownerId).toBe('away_1');
  });

  it('top havadaysa z 0.5 metrenin üzerindeyken pickup yapılmaz', () => {
    const player = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const ball = makeBall({ position: { x: 0, y: 0, z: 1 } });
    const current = makeEmptyState([player], ball);
    const next = makeEmptyState([player], ball);

    new PurePhysicsEngine().step(current, noIntents, next, DT;

    expect(next.ball.ownerId).toBeNull();
  });
});
