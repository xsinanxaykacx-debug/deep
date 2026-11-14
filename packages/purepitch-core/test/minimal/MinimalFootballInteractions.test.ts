import { describe, expect, it } from 'vitest';
import { createMinimalScene } from '../../src/minimal/MinimalFootballPhysics.js';
import {
  MatchRandomStreams,
  SeededRandom,
  decideAttackerAction,
  resolveDribble,
  resolveFirstTouch,
  resolvePass,
  resolveShot,
  resolveTackle,
} from '../../src/minimal/MinimalFootballInteractions.js';

const scene = createMinimalScene();
const attacker = scene.players.find(player => player.id === 'attacker')!;
const defender = scene.players.find(player => player.id === 'defender')!;
const goalkeeper = scene.players.find(player => player.id === 'goalkeeper')!;

describe('minimal football interaction model', () => {
  it('creates isolated deterministic random streams', () => {
    const a = new MatchRandomStreams(1234);
    const b = new MatchRandomStreams(1234);
    const c = new MatchRandomStreams(5678);
    const aValues = [a.forPlayer(4, 'attacker').next(), a.forPhysics(4).next(), a.forEvents(4).next()];
    const bValues = [b.forPlayer(4, 'attacker').next(), b.forPhysics(4).next(), b.forEvents(4).next()];
    const cValues = [c.forPlayer(4, 'attacker').next(), c.forPhysics(4).next(), c.forEvents(4).next()];
    expect(aValues).toEqual(bValues);
    expect(cValues).not.toEqual(aValues);
    expect(a.forPlayer(4, 'attacker').next()).not.toBe(a.forPlayer(4, 'defender').next());
  });

  it('keeps all sampled random values in [0, 1)', () => {
    const random = new SeededRandom(9);
    for (let i = 0; i < 1000; i += 1) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('makes first touch depend on first touch, composure, incoming speed and pressure', () => {
    const calm = resolveFirstTouch({
      player: attacker, incomingSpeed: 2, approachAngleRadians: 0.1,
      pressure: 0.1, random: new SeededRandom(12),
    });
    const difficult = resolveFirstTouch({
      player: attacker, incomingSpeed: 22, approachAngleRadians: 2.4,
      pressure: 0.95, random: new SeededRandom(12),
    });
    expect(calm.probability).toBeGreaterThan(difficult.probability);
    expect(calm.retainedSpeed).toBeLessThan(2);
  });

  it('uses dribbling and defender physical/mental attributes in a duel', () => {
    const open = resolveDribble({
      attacker, defender, defenderDistance: 4, relativeSpeed: 1,
      random: new SeededRandom(22),
    });
    const tight = resolveDribble({
      attacker, defender, defenderDistance: 0.5, relativeSpeed: 7,
      random: new SeededRandom(22),
    });
    expect(open.probability).toBeGreaterThan(tight.probability);
  });

  it('uses passing, vision, decision, distance and lane obstruction', () => {
    const clear = resolvePass({
      passer: attacker, targetDistance: 8, pressure: 0.1,
      passingLaneObstruction: 0, random: new SeededRandom(33),
    });
    const blocked = resolvePass({
      passer: attacker, targetDistance: 28, pressure: 0.9,
      passingLaneObstruction: 1, random: new SeededRandom(33),
    });
    expect(clear.probability).toBeGreaterThan(blocked.probability);
  });

  it('uses tackling, strength, anticipation and carrier balance/dribbling', () => {
    const close = resolveTackle({
      tackler: defender, carrier: attacker, contactDistance: 0.3,
      relativeSpeed: 1, random: new SeededRandom(44),
    });
    const stretched = resolveTackle({
      tackler: defender, carrier: attacker, contactDistance: 1.3,
      relativeSpeed: 8, random: new SeededRandom(44),
    });
    expect(close.probability).toBeGreaterThan(stretched.probability);
  });

  it('samples a shot and goalkeeper response without guaranteeing a goal', () => {
    const results = Array.from({ length: 100 }, (_, seed) => resolveShot({
      shooter: attacker, goalkeeper, distance: 14, lateralOffset: 0.2,
      pressure: 0.25, random: new SeededRandom(seed + 1),
    }));
    expect(results.some(result => result.goal)).toBe(true);
    expect(results.some(result => result.saved)).toBe(true);
    expect(results.some(result => !result.onTarget)).toBe(true);
    expect(results.every(result => result.goal === (result.onTarget && !result.saved))).toBe(true);
  });

  it('uses goalkeeper attributes and shot placement to vary save probability', () => {
    const central = resolveShot({
      shooter: attacker, goalkeeper, distance: 10, lateralOffset: 0,
      pressure: 0.1, random: new SeededRandom(77),
    });
    const wide = resolveShot({
      shooter: attacker, goalkeeper, distance: 10, lateralOffset: 3.2,
      pressure: 0.1, random: new SeededRandom(77),
    });
    expect(central.saveProbability).toBeGreaterThanOrEqual(wide.saveProbability);
  });

  it('only requests a decision when a caller reports a game-state trigger', () => {
    const nearGoal = decideAttackerAction({
      player: attacker, distanceToGoal: 7, defenderDistance: 3,
      shootingLaneOpen: true, trigger: 'lane-opened', random: new SeededRandom(88),
    });
    const underPressure = decideAttackerAction({
      player: attacker, distanceToGoal: 25, defenderDistance: 0.7,
      shootingLaneOpen: false, trigger: 'pressure-changed', random: new SeededRandom(88),
    });
    expect(['shoot', 'dribble']).toContain(nearGoal);
    expect(['shoot', 'dribble']).toContain(underPressure);
    expect(nearGoal).not.toBe(underPressure);
  });
});
