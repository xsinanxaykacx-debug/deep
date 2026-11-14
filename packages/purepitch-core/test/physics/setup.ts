import type { BallState, MatchState, PlayerState } from '../../src/purepitch_v3.js';

export function makePlayer(
  id: string,
  teamId: 'home' | 'away',
  position: { x: number; y: number }
): PlayerState {
  return {
    id,
    teamId,
    position: { ...position },
    velocity: { x: 0, y: 0 },
    facing: 0,
    stamina: 100,
    attributes: {
      maxSpeed: 8,
      acceleration: 8,
      agility: 0.7,
      staminaMax: 100,
      passingSkill: 0.8,
      shootingSkill: 0.8
    },
    roleAnchor: { ...position }
  };
}

export function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    position: { x: 0, y: 0, z: 0.1 },
    velocity: { x: 0, y: 0, z: 0 },
    spin: { x: 0, y: 0, z: 0 },
    ownerId: null,
    lastTouchId: null,
    controlStrength: 0,
    ...overrides
  };
}

export function makeEmptyState(players: PlayerState[], ball: BallState): MatchState {
  const map = new Map(players.map((player) => [player.id, {
    ...player,
    position: { ...player.position },
    velocity: { ...player.velocity }
  }]));
  return {
    tickId: 0,
    ball: {
      ...ball,
      position: { ...ball.position },
      velocity: { ...ball.velocity },
      spin: { ...ball.spin }
    },
    players: map,
    playerOrder: players.map((player) => player.id)
  };
}
