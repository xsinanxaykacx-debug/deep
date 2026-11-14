// Deterministik test fixture'ı — aynı seed her koşuda aynı 22 oyuncu + top.
// Motorun kendi PRNG'sinden BAĞIMSIZ (test amaçlı).

import type { MatchState, PlayerState, PlayerIntent, IRandomSource, BallState, PlayerAttributes } from '../../src/purepitch_v3.js';

export class SeededRandom implements IRandomSource {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 0x6d2b79f5; // 0 durumu önle
  }
  nextUint32(): number {
    let x = this.state;
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;  x >>>= 0;
    this.state = x;
    return x;
  }
  next(): number {
    return this.nextUint32() / 0x100000000;
  }
}

export const FIXTURE_SEED = 0xC0FFEE42;
export const INTENT_SEED = 0xBADC0DE;

const HOME_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [-45, 0], [-30, -25], [-30, 0], [-30, 25], [-15, -30], [-15, 0],
  [-15, 30], [-5, -25], [-5, 25], [0, -10], [0, 10],
];

const AWAY_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [45, 0], [30, -25], [30, 0], [30, 25], [15, -30], [15, -10],
  [15, 10], [15, 30], [0, -20], [0, 20], [0, 0],
];

export function createFixtureState(): MatchState {
  const rng = new SeededRandom(FIXTURE_SEED);
  const players = new Map<string, PlayerState>();
  const playerOrder: string[] = [];

  const make = (
    id: string,
    teamId: 'home' | 'away',
    anchor: readonly [number, number],
    withStrength: boolean,
  ): PlayerState => {
    const attrs: PlayerAttributes & { strength?: number } = {
      maxSpeed: 6.0 + rng.next() * 3.0,
      acceleration: 5.0 + rng.next() * 4.0,
      agility: 0.5 + rng.next() * 0.5,
      staminaMax: 100,
      passingSkill: 0.5 + rng.next() * 0.5,
      shootingSkill: 0.5 + rng.next() * 0.5,
    };
    if (withStrength) attrs.strength = 1.0 + rng.next() * 0.5; // kütle benzeri
    return {
      id,
      teamId,
      position: {
        x: anchor[0] + (rng.next() - 0.5) * 2,
        y: anchor[1] + (rng.next() - 0.5) * 2,
      },
      velocity: { x: 0, y: 0 },
      stamina: 100,
      attributes: attrs,
      roleAnchor: { x: anchor[0], y: anchor[1] },
    };
  };

  for (let i = 0; i < 11; i++) {
    const id = `home_${i}`;
    players.set(id, make(id, 'home', HOME_ANCHORS[i], true));
    playerOrder.push(id);
  }
  for (let i = 0; i < 11; i++) {
    const id = `away_${i}`;
    players.set(id, make(id, 'away', AWAY_ANCHORS[i], true));
    playerOrder.push(id);
  }

  const ball: BallState = {
    position: { x: 0, y: 0, z: 0.11 },
    velocity: { x: 0, y: 0, z: 0 },
    spin: { x: 0, y: 0, z: 0 },
    ownerId: null,
    controlStrength: 0,
  };

  return { tickId: 0, ball, players, playerOrder };
}

/**
 * Deterministik intent üretici.
 * v4 actionType'ı işlemediği için sadece 'move' üretiyoruz.
 * RNG seed sabit → aynı tick dizisinde aynı intent.
 */
export function createDeterministicIntents(
  state: MatchState,
  tick: number,
  rng: IRandomSource,
): Map<string, PlayerIntent> {
  void tick; // şimdilik kullanılmıyor, v5'te davranış değişimi için lazım olacak
  const intents = new Map<string, PlayerIntent>();
  for (const id of state.playerOrder) {
    const p = state.players.get(id)!;
    const dx = p.roleAnchor.x - p.position.x;
    const dy = p.roleAnchor.y - p.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = dist > 0.1 ? Math.min(p.attributes.maxSpeed, dist * 0.5) : 0;
    const jx = (rng.next() - 0.5) * 0.5;
    const jy = (rng.next() - 0.5) * 0.5;
    intents.set(id, {
      targetVelocity: dist > 0.1
        ? { x: (dx / dist) * speed + jx, y: (dy / dist) * speed + jy }
        : { x: 0, y: 0 },
      sprint: rng.next() > 0.7,
      actionType: 'move',
    });
  }
  return intents;
}
