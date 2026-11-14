import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PHYSICS_CONFIG,
  PurePhysicsEngine
} from '../../src/PurePhysicsEngine.js';
import type {
  BallState,
  IRandomSource,
  MatchState,
  PlayerIntent
} from '../../src/purepitch_v3.js';

const DT = 1 / 60;
const noIntents = new Map<string, PlayerIntent>();
const noRng: IRandomSource = {
  next: () => 0.5,
  nextUint32: () => 0x80000000
};

function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    position: { x: 0, y: 0, z: 10 },
    velocity: { x: 10, y: 0, z: 0 },
    spin: { x: 0, y: 0, z: 0 },
    ownerId: null,
    controlStrength: 0,
    ...overrides
  };
}

function makeState(ball: BallState): MatchState {
  return {
    tickId: 0,
    ball,
    players: new Map(),
    playerOrder: []
  };
}

function stepBall(ball: BallState, groundFriction = 1): BallState {
  const engine = new PurePhysicsEngine({
    ...DEFAULT_PHYSICS_CONFIG,
    groundFriction
  });
  const current = makeState(ball);
  const next = makeState(makeBall());
  engine.step(current, noIntents, next, DT, noRng);
  return next.ball;
}

describe('Magnus etkisi — v5-P0c', () => {
  it('spin sıfırken yatay sapma üretmez', () => {
    const result = stepBall(makeBall({
      velocity: { x: 10, y: 0, z: 0 },
      spin: { x: 0, y: 0, z: 0 }
    }));

    expect(result.velocity.x).toBe(10);
    expect(result.velocity.y).toBe(0);
    expect(result.position.y).toBe(0);
  });

  it('z-spin ve +x hız, +y yönünde Magnus üretir', () => {
    const result = stepBall(makeBall({
      velocity: { x: 10, y: 0, z: 0 },
      spin: { x: 0, y: 0, z: 10 }
    }));
    const expectedVy = DEFAULT_PHYSICS_CONFIG.magnusCoefficient * 100 * DT;

    expect(result.velocity.y).toBeCloseTo(expectedVy, 12);
    expect(result.position.y).toBeCloseTo(expectedVy * DT, 12);
  });

  it('x/y/z spin bileşenlerini aynı ara hız vektörüyle hesaplar', () => {
    const velocity = { x: 20, y: 3, z: -10 };
    const spin = { x: 2, y: 5, z: 7 };
    const result = stepBall(makeBall({
      position: { x: 0, y: 0, z: 10 },
      velocity,
      spin
    }));

    const vzAfterGravity = velocity.z - 9.81 * DT;
    const crossX = spin.y * vzAfterGravity - spin.z * velocity.y;
    const crossY = spin.z * velocity.x - spin.x * vzAfterGravity;
    const crossZ = spin.x * velocity.y - spin.y * velocity.x;
    const k = DEFAULT_PHYSICS_CONFIG.magnusCoefficient;

    expect(result.velocity.x).toBeCloseTo(velocity.x + k * crossX * DT, 12);
    expect(result.velocity.y).toBeCloseTo(velocity.y + k * crossY * DT, 12);
    expect(result.velocity.z).toBeCloseTo(vzAfterGravity + k * crossZ * DT, 12);
  });

  it('Magnus sonrası yatay sürtünme uygulanır', () => {
    const friction = 0.5;
    const result = stepBall(makeBall({
      velocity: { x: 10, y: 0, z: 0 },
      spin: { x: 0, y: 0, z: 10 }
    }), friction);
    const magnusVy = DEFAULT_PHYSICS_CONFIG.magnusCoefficient * 100 * DT;

    expect(result.velocity.y).toBeCloseTo(magnusVy * friction, 12);
    expect(result.velocity.x).toBeCloseTo(10 * friction, 12);
  });
});
