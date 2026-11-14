import { describe, expect, it } from 'vitest';
import { PurePhysicsEngine } from '../../src/PurePhysicsEngine.js';
import type { MatchState, PlayerIntent } from '../../src/purepitch_v3.js';
import { makeBall, makeEmptyState, makePlayer } from './setup.js';

const DT = 1 / 60;

function cloneState(state: MatchState): MatchState {
  return {
    tickId: state.tickId,
    ball: {
      ...state.ball,
      position: { ...state.ball.position },
      velocity: { ...state.ball.velocity },
      spin: { ...state.ball.spin }
    },
    players: new Map([...state.players].map(([id, player]) => [id, {
      ...player,
      position: { ...player.position },
      velocity: { ...player.velocity }
    }])),
    playerOrder: [...state.playerOrder]
  };
}

function step(state: MatchState, intents: Map<string, PlayerIntent> = new Map()): MatchState {
  const next = cloneState(state);
  new PurePhysicsEngine().step(state, intents, next, DT);
  return next;
}

function ownedState(tickId = 10): MatchState {
  const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
  const state = makeEmptyState([owner], makeBall({
    ownerId: 'home_1',
    lastTouchId: 'home_1',
    position: { x: 0.4, y: 0, z: 0.1 },
    controlStrength: 1
  }));
  (state as { tickId: number }).tickId = tickId;
  return state;
}

describe('dribble pickup window — Commit 3', () => {
  it('başarılı dribble 30 tick penceresini dribble tick dahil açar', () => {
    const state = ownedState(10);
    const result = step(state, new Map([['home_1', {
      kind: 'dribble', sprint: false, dribbleDirection: 0, success: true
    }]]));
    expect(result.tickId).toBe(11);
    expect(result.ball.ownerId).toBeNull();
    expect(result.ball.lastTouchId).toBe('home_1');
    expect(result.ball.controlStrength).toBe(0.8);
    expect(result.ball.velocity.x).toBeCloseTo(5, 10);
    expect(result.ball.velocity.y).toBeCloseTo(0, 10);
    expect(result.ball.dribbleUntilTick).toBe(40);
  });

  it('başarısız dribble kısa hız üretir ve pencere açmaz', () => {
    const result = step(ownedState(10), new Map([['home_1', {
      kind: 'dribble', sprint: false, dribbleDirection: Math.PI / 2, success: false
    }]]));
    expect(result.ball.ownerId).toBeNull();
    expect(result.ball.lastTouchId).toBe('home_1');
    expect(result.ball.controlStrength).toBe(0);
    expect(result.ball.velocity.x).toBeCloseTo(0, 10);
    expect(result.ball.velocity.y).toBeCloseTo(1.5, 10);
    expect(result.ball.dribbleUntilTick).toBe(0);
  });

  it('eski dribbler aktif pencerede 0.45 m içinde olsa da pickup yapamaz', () => {
    const player = makePlayer('home_1', 'home', { x: 0.2, y: 0 });
    const state = makeEmptyState([player], makeBall({
      position: { x: 0, y: 0, z: 0.1 },
      lastTouchId: 'home_1',
      dribbleUntilTick: 40
    }));
    (state as { tickId: number }).tickId = 10;
    const result = step(state);
    expect(result.ball.ownerId).toBeNull();
    expect(result.ball.lastTouchId).toBe('home_1');
  });

  it('rakip aktif pencerede normal pickup mesafesiyle topu alabilir ve pencere temizlenir', () => {
    const dribbler = makePlayer('home_1', 'home', { x: -2, y: 0 });
    const opponent = makePlayer('away_1', 'away', { x: 0.2, y: 0 });
    const state = makeEmptyState([dribbler, opponent], makeBall({
      position: { x: 0, y: 0, z: 0.1 },
      lastTouchId: 'home_1',
      dribbleUntilTick: 40
    }));
    (state as { tickId: number }).tickId = 10;
    const result = step(state);
    expect(result.ball.ownerId).toBe('away_1');
    expect(result.ball.lastTouchId).toBe('away_1');
    expect(result.ball.dribbleUntilTick).toBe(0);
  });

  it('aktif pencerede mesafe temizliği lastTouchId değerini silmez', () => {
    const dribbler = makePlayer('home_1', 'home', { x: 2, y: 0 });
    const state = makeEmptyState([dribbler], makeBall({
      position: { x: 0, y: 0, z: 0.1 },
      lastTouchId: 'home_1',
      dribbleUntilTick: 40
    }));
    (state as { tickId: number }).tickId = 10;
    const result = step(state);
    expect(result.ball.lastTouchId).toBe('home_1');
    expect(result.ball.ownerId).toBeNull();
  });

  it('39 son aktif tick, 40 ilk pasif ticktir; süre bitince eski owner normal kurala döner', () => {
    const dribbler = makePlayer('home_1', 'home', { x: 2, y: 0 });
    const state = makeEmptyState([dribbler], makeBall({
      position: { x: 0, y: 0, z: 0.1 },
      lastTouchId: 'home_1',
      dribbleUntilTick: 40
    }));
    (state as { tickId: number }).tickId = 38;
    const tick39 = step(state);
    expect(tick39.tickId).toBe(39);
    expect(tick39.ball.lastTouchId).toBe('home_1');
    const tick40 = step(tick39);
    expect(tick40.tickId).toBe(40);
    expect(tick40.ball.lastTouchId).toBeNull();
    tick40.players.get('home_1')!.position = { x: 0.2, y: 0 };
    const tick41 = step(tick40);
    expect(tick41.ball.ownerId).toBe('home_1');
  });

  it('pickup sahiplik değişiminde dribble penceresini temizler', () => {
    const player = makePlayer('away_1', 'away', { x: 0.2, y: 0 });
    const state = makeEmptyState([player], makeBall({
      position: { x: 0, y: 0, z: 0.1 },
      lastTouchId: 'home_1',
      dribbleUntilTick: 40
    }));
    (state as { tickId: number }).tickId = 10;
    const result = step(state);
    expect(result.ball.ownerId).toBe('away_1');
    expect(result.ball.dribbleUntilTick).toBe(0);
  });

  it('tackle sahiplik değişiminde dribble penceresini temizler', () => {
    const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
    const tackler = makePlayer('away_1', 'away', { x: 0.8, y: 0 });
    const state = makeEmptyState([owner, tackler], makeBall({
      ownerId: 'home_1',
      lastTouchId: 'home_1',
      dribbleUntilTick: 99
    }));
    const intents = new Map<string, PlayerIntent>([['away_1', {
      kind: 'tackle', targetVelocity: { x: 0, y: 0 }, sprint: false, tackleTargetId: 'home_1'
    }]]);
    const result = step(state, intents);
    expect(result.ball.ownerId).toBe('away_1');
    expect(result.ball.dribbleUntilTick).toBe(0);
  });

  it('pas ve şut dribble penceresini temizler', () => {
    for (const intent of [
      { kind: 'pass', targetVelocity: { x: 0, y: 0 }, sprint: false, passTargetId: 'home_2', passSpeed: 10 },
      { kind: 'shoot', targetVelocity: { x: 0, y: 0 }, sprint: false, shootSpeed: 20, shootDirection: 0, shootSpin: { x: 0, y: 0, z: 0 } }
    ] satisfies PlayerIntent[]) {
      const owner = makePlayer('home_1', 'home', { x: 0, y: 0 });
      const receiver = makePlayer('home_2', 'home', { x: 5, y: 0 });
      const state = makeEmptyState([owner, receiver], makeBall({
        ownerId: 'home_1',
        lastTouchId: 'home_1',
        dribbleUntilTick: 99
      }));
      const result = step(state, new Map([['home_1', intent]]));
      expect(result.ball.ownerId).toBeNull();
      expect(result.ball.dribbleUntilTick).toBe(0);
    }
  });

  it('dribble olmayan normal pickup akışında pencere sıfır kalır', () => {
    const player = makePlayer('home_1', 'home', { x: 0.2, y: 0 });
    const state = makeEmptyState([player], makeBall({ position: { x: 0, y: 0, z: 0.1 } }));
    const result = step(state);
    expect(result.ball.ownerId).toBe('home_1');
    expect(result.ball.dribbleUntilTick).toBe(0);
  });
});
