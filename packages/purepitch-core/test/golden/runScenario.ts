// Tek koşu — motor davranışını DEĞİŞTİRMEZ, sadece gözlemler.

import type { MatchState, PlayerState } from '../../src/purepitch_v3.js';
import { PurePhysicsEngine, type PhysicsConfig } from '../../src/PurePhysicsEngine.js';
import {
  createFixtureState,
  createScriptedIntents,
  SeededRandomProvider,
  FIXTURE_SEED,
  INTENT_SEED,
} from './fixture.js';
import { hashState } from './hashState.js';

export interface ScenarioConfig {
  readonly ticks: number;
  /** true ise her tick'in state snapshot'ı saklanır (bellek pahalı). */
  readonly captureStates?: boolean;
  readonly engineConfig?: PhysicsConfig;
  readonly intentSeed?: number;
  /** Legacy scenario metadata only; the physics engine no longer consumes RNG. */
  readonly physicsSeed?: number;
}

export interface ScenarioResult {
  readonly hashes: readonly string[];
  /** captureStates=true ise dolu, aksi halde null. states[t] = tick t sonrası. */
  readonly states: readonly MatchState[] | null;
  readonly finalState: MatchState;
  readonly config: Required<Omit<ScenarioConfig, 'engineConfig'>> & {
    engineConfig: PhysicsConfig | undefined;
  };
}

function clonePlayer(p: PlayerState): PlayerState {
  return {
    ...p,
    position: { ...p.position },
    velocity: { ...p.velocity },
    attributes: { ...p.attributes },
    roleAnchor: { ...p.roleAnchor },
  };
}

function cloneState(s: MatchState): MatchState {
  const clonedPlayers = new Map<string, PlayerState>();
  for (const [id, p] of s.players) clonedPlayers.set(id, clonePlayer(p));
  return {
    tickId: s.tickId,
    ball: {
      position: { ...s.ball.position },
      velocity: { ...s.ball.velocity },
      spin: { ...s.ball.spin },
      ownerId: s.ball.ownerId,
      ...(s.ball.lastTouchId ? { lastTouchId: s.ball.lastTouchId } : {}),
      controlStrength: s.ball.controlStrength,
    },
    players: clonedPlayers,
    playerOrder: [...s.playerOrder],
  };
}

export function runScenario(config: ScenarioConfig): ScenarioResult {
  const ticks = config.ticks;
  const capture = config.captureStates === true;
  const intentSeed = config.intentSeed ?? INTENT_SEED;
  const physicsSeed = config.physicsSeed ?? FIXTURE_SEED;

  const engine = new PurePhysicsEngine(config.engineConfig);
  const initial = createFixtureState();

  // Double-buffer: current ve next ayrı nesneler.
  let current: MatchState = initial;
  let next: MatchState = cloneState(initial);

  const hashes: string[] = [hashState(current)];
  const states: MatchState[] | null = capture ? [cloneState(current)] : null;

  const rngProvider = new SeededRandomProvider(intentSeed);

  for (let t = 0; t < ticks; t++) {
    const aiRng = rngProvider.forAI(current.tickId);
    const intents = createScriptedIntents(current, t, aiRng);

    engine.step(current, intents, next, 1 / 60);

    // Swap
    const tmp = current;
    current = next;
    next = tmp;

    hashes.push(hashState(current));
    if (states) states.push(cloneState(current));
  }

  return {
    hashes,
    states,
    finalState: current,
    config: {
      ticks,
      captureStates: capture,
      intentSeed,
      physicsSeed,
      engineConfig: config.engineConfig,
    },
  };
}
