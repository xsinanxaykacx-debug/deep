import { describe, expect, it } from 'vitest';
import { PurePhysicsEngine } from '../../src/PurePhysicsEngine.js';
import type { IRandomSource, PlayerIntent } from '../../src/purepitch_v3.js';
import { makeBall, makeEmptyState, makePlayer } from './setup.js';

const DT = 1 / 60;
const noRng: IRandomSource = {
  next: () => 0.5,
  nextUint32: () => 0x80000000
};

describe('PlayerIntent: pass', () => {
  it('pas topu serbest bırakır ve hedefe doğru istenen hızı uygular', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const target = makePlayer('home_2', 'home', { x: 10, y: 0 });
    const current = makeEmptyState([owner, target], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const next = makeEmptyState([owner, target], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const intents = new Map<string, PlayerIntent>([['home_1', {
      kind: 'pass', targetVelocity: { x: 0, y: 0 }, sprint: false,
      passTargetId: 'home_2', passSpeed: 15
    }]]);

    new PurePhysicsEngine().step(current, intents, next, DT, noRng);

    expect(next.ball.ownerId).toBeNull();
    expect(next.ball.controlStrength).toBe(0);
    expect(next.ball.velocity.x).toBeGreaterThan(0);
    expect(next.ball.velocity.x).toBeCloseTo(15, 5);
    expect(next.ball.velocity.y).toBeCloseTo(0, 8);
  });

  it('hedef bulunamazsa pas iptal olur ve top sahibinde kalır', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const current = makeEmptyState([owner], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const next = makeEmptyState([owner], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const intents = new Map<string, PlayerIntent>([['home_1', {
      kind: 'pass', targetVelocity: { x: 0, y: 0 }, sprint: false,
      passTargetId: 'missing', passSpeed: 15
    }]]);

    new PurePhysicsEngine().step(current, intents, next, DT, noRng);

    expect(next.ball.ownerId).toBe('home_1');
  });
});

describe('PlayerIntent: shoot', () => {
  it('şut topu serbest bırakır ve AI tarafından verilen yön, hız ve spin değerlerini uygular', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const current = makeEmptyState([owner], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const next = makeEmptyState([owner], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const intents = new Map<string, PlayerIntent>([['home_1', {
      kind: 'shoot', targetVelocity: { x: 0, y: 0 }, sprint: false,
      shootSpeed: 25, shootDirection: 0, shootSpin: { x: 1, y: 2, z: 5 }
    }]]);

    new PurePhysicsEngine().step(current, intents, next, DT, noRng);

    expect(next.ball.ownerId).toBeNull();
    expect(next.ball.velocity.x).toBeCloseTo(25, 8);
    expect(next.ball.velocity.y).toBeCloseTo(0, 8);
    expect(next.ball.spin).toEqual({ x: 1, y: 2, z: 5 });
  });
});

describe('PlayerIntent: tackle', () => {
  it('menzil içindeki rakip top sahipliğini alır', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const tackler = makePlayer('away_1', 'away', { x: 0.8, y: 0 });
    const current = makeEmptyState([owner, tackler], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const next = makeEmptyState([owner, tackler], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const intents = new Map<string, PlayerIntent>([['away_1', {
      kind: 'tackle', targetVelocity: { x: 0, y: 0 }, sprint: false,
      tackleTargetId: 'home_1'
    }]]);

    new PurePhysicsEngine().step(current, intents, next, DT, noRng);

    expect(next.ball.ownerId).toBe('away_1');
  });

  it('menzil dışındaki tackle sahipliği değiştirmez', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const tackler = makePlayer('away_1', 'away', { x: 2, y: 0 });
    const current = makeEmptyState([owner, tackler], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const next = makeEmptyState([owner, tackler], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const intents = new Map<string, PlayerIntent>([['away_1', {
      kind: 'tackle', targetVelocity: { x: 0, y: 0 }, sprint: false,
      tackleTargetId: 'home_1'
    }]]);

    new PurePhysicsEngine().step(current, intents, next, DT, noRng);

    expect(next.ball.ownerId).toBe('home_1');
  });

  it('aynı takım oyuncusu top sahibine tackle uygulayamaz', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const teammate = makePlayer('home_2', 'home', { x: 0.8, y: 0 });
    const current = makeEmptyState([owner, teammate], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const next = makeEmptyState([owner, teammate], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const intents = new Map<string, PlayerIntent>([['home_2', {
      kind: 'tackle', targetVelocity: { x: 0, y: 0 }, sprint: false,
      tackleTargetId: 'home_1'
    }]]);

    new PurePhysicsEngine().step(current, intents, next, DT, noRng);

    expect(next.ball.ownerId).toBe('home_1');
  });

  it('birden fazla tackle durumunda playerOrder sırasındaki ilk rakip kazanır', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const first = makePlayer('away_1', 'away', { x: 0.7, y: 0 });
    const second = makePlayer('away_2', 'away', { x: -0.7, y: 0 });
    const current = makeEmptyState([owner, first, second], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const next = makeEmptyState([owner, first, second], makeBall({ ownerId: owner.id, controlStrength: 1 }));
    const intents = new Map<string, PlayerIntent>([
      ['away_1', { kind: 'tackle', targetVelocity: { x: 0, y: 0 }, sprint: false, tackleTargetId: 'home_1' }],
      ['away_2', { kind: 'tackle', targetVelocity: { x: 0, y: 0 }, sprint: false, tackleTargetId: 'home_1' }]
    ]);

    new PurePhysicsEngine().step(current, intents, next, DT, noRng);

    expect(next.ball.ownerId).toBe('away_1');
  });
});
