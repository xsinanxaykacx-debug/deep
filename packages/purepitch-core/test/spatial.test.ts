import { describe, expect, it } from 'vitest';
import type { MatchState, PlayerState } from '../src/purepitch_v3.js';
import { SpatialAnalyzer } from '../src/SpatialAnalyzer.js';
import { makeBall, makeEmptyState, makePlayer } from './physics/setup.js';
import { createFixtureState } from './golden/fixture.js';

function player(
  id: string,
  teamId: 'home' | 'away',
  position: { x: number; y: number },
  maxSpeed = 8,
): PlayerState {
  const base = makePlayer(id, teamId, position);
  return {
    ...base,
    attributes: { ...base.attributes, maxSpeed },
  };
}

function stateWithOrder(
  players: PlayerState[],
  playerOrder: string[],
): MatchState {
  const state = makeEmptyState(players, makeBall());
  return { ...state, playerOrder };
}

describe('SpatialAnalyzer — input validation', () => {
  const analyzer = new SpatialAnalyzer();
  const empty = makeEmptyState([], makeBall());

  it('rejects non-positive resolution', () => {
    expect(() => analyzer.calculatePitchControl(empty, 0)).toThrow(/resolution/);
    expect(() => analyzer.calculatePitchControl(empty, -1)).toThrow(/resolution/);
  });

  it('rejects NaN and Infinity resolution', () => {
    expect(() => analyzer.calculatePitchControl(empty, NaN)).toThrow(/resolution/);
    expect(() => analyzer.calculatePitchControl(empty, Infinity)).toThrow(/resolution/);
  });

  it('rejects playerOrder ids missing from players', () => {
    const inconsistent = { ...empty, playerOrder: ['home_1'] };
    expect(() => analyzer.calculatePitchControl(inconsistent, 1)).toThrow(/playerOrder/);
  });

  it('rejects duplicate playerOrder ids', () => {
    const home = player('home_1', 'home', { x: 10, y: 10 });
    const away = player('away_1', 'away', { x: 20, y: 20 });
    const inconsistent = stateWithOrder([home, away], ['home_1', 'home_1']);
    expect(() => analyzer.calculatePitchControl(inconsistent, 1)).toThrow(/yinelenen/);
  });

  it('rejects a players map entry omitted from playerOrder', () => {
    const p = player('home_1', 'home', { x: 10, y: 10 });
    const inconsistent = stateWithOrder([p], []);
    expect(() => analyzer.calculatePitchControl(inconsistent, 1)).toThrow(/boyutları/);
  });

  it('rejects invalid teamId', () => {
    const p = makePlayer('home_1', 'home', { x: 10, y: 10 });
    const invalid = { ...p, teamId: 'invalid' as 'home' };
    const state = makeEmptyState([invalid], makeBall());
    expect(() => analyzer.calculatePitchControl(state, 1)).toThrow(/teamId/);
  });

  it('rejects non-finite player position and maxSpeed', () => {
    const badPosition = player('home_1', 'home', { x: NaN, y: 10 });
    expect(() => analyzer.calculatePitchControl(
      makeEmptyState([badPosition], makeBall()), 1,
    )).toThrow(/konumu/);

    const badSpeed = player('home_1', 'home', { x: 10, y: 10 }, Infinity);
    expect(() => analyzer.calculatePitchControl(
      makeEmptyState([badSpeed], makeBall()), 1,
    )).toThrow(/maxSpeed/);
  });
});

describe('SpatialAnalyzer — grid dimensions', () => {
  const analyzer = new SpatialAnalyzer();
  const state = makeEmptyState([], makeBall());

  it('resolution 1.0 produces 105 × 68', () => {
    const grid = analyzer.calculatePitchControl(state, 1);
    expect(grid.width).toBe(105);
    expect(grid.height).toBe(68);
    expect(grid.cellSize).toBe(1);
    expect(grid.ownershipQ15.length).toBe(105 * 68);
    expect(grid.tickId).toBe(state.tickId);
  });

  it('resolution 2.0 produces 53 × 34', () => {
    const grid = analyzer.calculatePitchControl(state, 2);
    expect(grid.width).toBe(53);
    expect(grid.height).toBe(34);
    expect(grid.cellSize).toBe(2);
    expect(grid.ownershipQ15.length).toBe(53 * 34);
  });

  it('resolution 0.5 produces 210 × 136', () => {
    const grid = analyzer.calculatePitchControl(state, 0.5);
    expect(grid.width).toBe(210);
    expect(grid.height).toBe(136);
  });
});

describe('SpatialAnalyzer — ownership', () => {
  const analyzer = new SpatialAnalyzer();

  it('empty pitch leaves every cell neutral', () => {
    const grid = analyzer.calculatePitchControl(makeEmptyState([], makeBall()), 1);
    expect(Array.from(grid.ownershipQ15).every((value) => value === 0)).toBe(true);
  });

  it('single home player owns every in-pitch cell', () => {
    const p = player('home_1', 'home', { x: 52.5, y: 34 });
    const grid = analyzer.calculatePitchControl(makeEmptyState([p], makeBall()), 1);
    expect(Array.from(grid.ownershipQ15).every((value) => value === 32767)).toBe(true);
  });

  it('single away player owns every in-pitch cell', () => {
    const p = player('away_1', 'away', { x: 52.5, y: 34 });
    const grid = analyzer.calculatePitchControl(makeEmptyState([p], makeBall()), 1);
    expect(Array.from(grid.ownershipQ15).every((value) => value === -32767)).toBe(true);
  });
});

describe('SpatialAnalyzer — boundaries', () => {
  const analyzer = new SpatialAnalyzer();

  it('uses the 0.1 m/s floor when maxSpeed is zero or negative', () => {
    for (const maxSpeed of [0, -2]) {
      const p = player('home_1', 'home', { x: 52.5, y: 34 }, maxSpeed);
      const grid = analyzer.calculatePitchControl(makeEmptyState([p], makeBall()), 1);
      expect(Array.from(grid.ownershipQ15).every((value) => value === 32767)).toBe(true);
    }
  });

  it('allows players outside the pitch to influence in-pitch cells', () => {
    const p = player('home_1', 'home', { x: -10, y: -10 });
    const grid = analyzer.calculatePitchControl(makeEmptyState([p], makeBall()), 1);
    expect(Array.from(grid.ownershipQ15).every((value) => value === 32767)).toBe(true);
  });


  it('uses cell centers and row-major indexing', () => {
    const home = player('home_1', 'home', { x: 0.5, y: 0.5 });
    const away = player('away_1', 'away', { x: 1.5, y: 0.5 });
    const grid = analyzer.calculatePitchControl(
      stateWithOrder([home, away], ['home_1', 'away_1']), 1,
    );
    expect(grid.ownershipQ15[0]).toBe(32767);
    expect(grid.ownershipQ15[1]).toBe(-32767);
  });

  it('includes cell centers exactly on the pitch boundary', () => {
    const p = player('home_1', 'home', { x: 52, y: 34 });
    const grid = analyzer.calculatePitchControl(makeEmptyState([p], makeBall()), 2);
    expect(grid.ownershipQ15[33 * 53 + 52]).toBe(32767);
  });

  it('leaves out-of-pitch cell centers neutral at resolution 1.5', () => {
    const p = player('home_1', 'home', { x: 52, y: 34 });
    const grid = analyzer.calculatePitchControl(makeEmptyState([p], makeBall()), 1.5);
    expect(grid.width).toBe(70);
    expect(grid.height).toBe(46);
    expect(grid.ownershipQ15[45 * 70 + 69]).toBe(0);
    expect(grid.ownershipQ15[44 * 70 + 69]).toBe(32767);
  });
});

describe('SpatialAnalyzer — deterministic tie-break', () => {
  const analyzer = new SpatialAnalyzer();

  it('gives an exact equal-time tie to the first player in playerOrder', () => {
    const home = player('home_1', 'home', { x: 52, y: 34.5 });
    const away = player('away_1', 'away', { x: 53, y: 34.5 });
    const grid = analyzer.calculatePitchControl(
      stateWithOrder([home, away], ['home_1', 'away_1']), 1,
    );
    expect(grid.ownershipQ15[34 * 105 + 52]).toBe(32767);
  });

  it('reversing playerOrder reverses the exact-tie winner', () => {
    const home = player('home_1', 'home', { x: 52, y: 34.5 });
    const away = player('away_1', 'away', { x: 53, y: 34.5 });
    const homeFirst = analyzer.calculatePitchControl(
      stateWithOrder([home, away], ['home_1', 'away_1']), 1,
    );
    const awayFirst = analyzer.calculatePitchControl(
      stateWithOrder([home, away], ['away_1', 'home_1']), 1,
    );
    const index = 34 * 105 + 52;
    expect(homeFirst.ownershipQ15[index]).toBe(32767);
    expect(awayFirst.ownershipQ15[index]).toBe(-32767);
  });
});

describe('SpatialAnalyzer — determinism and immutability', () => {
  const analyzer = new SpatialAnalyzer();

  it('returns the same grid for 1000 repeated calculations', () => {
    const state = createFixtureState();
    const first = analyzer.calculatePitchControl(state, 1);
    for (let i = 0; i < 1000; i++) {
      const next = analyzer.calculatePitchControl(state, 1);
      expect(next.ownershipQ15).toEqual(first.ownershipQ15);
    }
  });

  it('does not mutate the input state', () => {
    const state = createFixtureState();
    const snapshot = JSON.stringify(state, (_key, value) =>
      value instanceof Map ? [...value.entries()] : value,
    );
    analyzer.calculatePitchControl(state, 1);
    const after = JSON.stringify(state, (_key, value) =>
      value instanceof Map ? [...value.entries()] : value,
    );
    expect(after).toBe(snapshot);
  });

  it('always allocates exactly width × height ownership cells', () => {
    const state = createFixtureState();
    for (const resolution of [0.5, 1, 1.5, 2, 3]) {
      const grid = analyzer.calculatePitchControl(state, resolution);
      expect(grid.ownershipQ15.length).toBe(grid.width * grid.height);
    }
  });

  it('only emits the three categorical Q15 values', () => {
    const grid = analyzer.calculatePitchControl(createFixtureState(), 1);
    for (const value of grid.ownershipQ15) {
      expect([-32767, 0, 32767]).toContain(value);
    }
  });
});
