import { describe, expect, it } from 'vitest';
import {
  createMinimalScene,
  stepMinimalScene,
  MINIMAL_PLAYER_PROFILES,
  type BallBody,
  type MinimalScene,
  type PlayerBody,
} from '../../src/minimal/MinimalFootballPhysics.js';

function withBall(scene: MinimalScene, ball: BallBody): MinimalScene {
  return { ...scene, ball, goalEvent: null };
}

function withPlayers(scene: MinimalScene, players: readonly PlayerBody[]): MinimalScene {
  return { ...scene, players, goalEvent: null };
}

describe('minimal football physics slice', () => {
  it('starts with an attacker, defender, goalkeeper, one ball and one goal', () => {
    const scene = createMinimalScene();
    expect(scene.players.map(player => player.role)).toEqual([
      'attacker',
      'defender',
      'goalkeeper',
    ]);
    expect(scene.ball.mass).toBeCloseTo(0.43);
    expect(scene.goal.width).toBeCloseTo(7.32);
    expect(scene.goal.height).toBeCloseTo(2.44);
  });

  it('gives each player a distinct continuous football skill profile', () => {
    const scene = createMinimalScene();
    const attacker = scene.players.find(player => player.id === 'attacker')!;
    const defender = scene.players.find(player => player.id === 'defender')!;
    const goalkeeper = scene.players.find(player => player.id === 'goalkeeper')!;
    expect('finishing' in attacker.attributes).toBe(true);
    if ('finishing' in attacker.attributes) {
      expect(attacker.attributes.finishing).toBe(84);
      expect(attacker.attributes.heading).toBe(78);
      expect(attacker.attributes.dribbling).toBe(76);
      expect(attacker.attributes.pace).toBe(83);
    }
    expect('marking' in defender.attributes).toBe(true);
    if ('marking' in defender.attributes) {
      expect(defender.attributes.marking).toBe(86);
      expect(defender.attributes.tackling).toBe(84);
    }
    expect(defender.archetype).toContain('stoper');
    expect('reflexes' in goalkeeper.attributes).toBe(true);
    if ('reflexes' in goalkeeper.attributes) {
      expect(goalkeeper.attributes.reflexes).toBe(86);
      expect(goalkeeper.attributes.oneOnOne).toBe(82);
    }
    for (const profile of MINIMAL_PLAYER_PROFILES) {
      for (const value of Object.values(profile.attributes)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
    expect(attacker.maxSpeed).toBeGreaterThan(defender.maxSpeed);
  });

  it('integrates player acceleration continuously and respects physical limits', () => {
    const scene = createMinimalScene();
    const next = stepMinimalScene(
      scene,
      { playerAccelerations: { attacker: { x: 2, y: 0 } } },
      0.1,
    );
    const attacker = next.players.find(player => player.id === 'attacker')!;
    expect(attacker.velocity.x).toBeGreaterThan(0);
    expect(attacker.position.x).toBeGreaterThan(scene.players[0].position.x);
    expect(Math.hypot(attacker.velocity.x, attacker.velocity.y)).toBeLessThanOrEqual(attacker.maxSpeed);
  });

  it('applies gravity to an airborne ball', () => {
    const scene = createMinimalScene();
    const airborne = withBall(scene, {
      ...scene.ball,
      position: { x: 10, y: 0, z: 2 },
      velocity: { x: 0, y: 0, z: 0 },
    });
    const next = stepMinimalScene(airborne, {}, 0.1);
    expect(next.ball.velocity.z).toBeLessThan(0);
    expect(next.ball.position.z).toBeLessThan(2);
  });

  it('reduces rolling speed continuously on the ground', () => {
    const scene = createMinimalScene();
    const rolling = withBall(scene, {
      ...scene.ball,
      position: { x: 10, y: 0, z: scene.ball.radius },
      velocity: { x: 5, y: 0, z: 0 },
    });
    const next = stepMinimalScene(rolling, {}, 0.1);
    expect(next.ball.velocity.x).toBeLessThan(5);
    expect(next.ball.velocity.x).toBeGreaterThan(0);
  });

  it('prevents two player bodies from occupying the same space', () => {
    const scene = createMinimalScene();
    const [attacker, defender, goalkeeper] = scene.players;
    const overlapping = withPlayers(scene, [
      { ...attacker, position: { x: 10, y: 0 } },
      { ...defender, position: { x: 10.1, y: 0 } },
      goalkeeper,
    ]);
    const next = stepMinimalScene(overlapping, {}, 1 / 120);
    const a = next.players[0];
    const b = next.players[1];
    expect(Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y))
      .toBeGreaterThanOrEqual(a.radius + b.radius - 1e-6);
  });

  it('detects a goal from the ball trajectory rather than a scheduled event', () => {
    const scene = createMinimalScene();
    const shot = withBall(scene, {
      ...scene.ball,
      position: { x: 52.3, y: 0, z: 0.11 },
      velocity: { x: 8, y: 0, z: 0 },
    });
    const next = stepMinimalScene(shot, {}, 0.05);
    expect(next.goalEvent).not.toBeNull();
    expect(next.goalEvent?.crossingY).toBeCloseTo(0);
  });

  it('does not score when the ball crosses outside the posts', () => {
    const scene = createMinimalScene();
    const wide = withBall(scene, {
      ...scene.ball,
      position: { x: 52.3, y: 4.2, z: 0.11 },
      velocity: { x: 8, y: 0, z: 0 },
    });
    const next = stepMinimalScene(wide, {}, 0.05);
    expect(next.goalEvent).toBeNull();
  });

  it('does not mutate the previous scene', () => {
    const scene = createMinimalScene();
    const originalX = scene.players[0].position.x;
    stepMinimalScene(scene, { playerAccelerations: { attacker: { x: 4, y: 0 } } }, 0.2);
    expect(scene.players[0].position.x).toBe(originalX);
  });

  it('rejects invalid time steps', () => {
    expect(() => stepMinimalScene(createMinimalScene(), {}, 0)).toThrow(RangeError);
  });
});
