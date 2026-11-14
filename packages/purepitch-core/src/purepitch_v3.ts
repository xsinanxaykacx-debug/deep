// PurePitch Engine v3 — tipler ve fizik sözleşmesi
// Bu paket FM27 kök yapılandırmasından bağımsızdır.

export type Vector2D = { x: number; y: number };
export type Vector3D = { x: number; y: number; z: number };

export type DeepReadonly<T> =
  T extends (infer U)[] ? ReadonlyArray<DeepReadonly<U>> :
  T extends Map<infer K, infer V> ? ReadonlyMap<K, DeepReadonly<V>> :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;

export interface PlayerAttributes {
  readonly maxSpeed: number;
  readonly acceleration: number;
  readonly agility: number;
  readonly staminaMax: number;
  readonly passingSkill: number;
  readonly shootingSkill: number;
}

export interface PlayerState {
  readonly id: string;
  readonly teamId: 'home' | 'away';
  position: Vector2D;
  velocity: Vector2D;
  /** Radyan cinsinden bakış yönü; 0 = +x ekseni. */
  facing: number;
  stamina: number;
  readonly attributes: PlayerAttributes;
  readonly roleAnchor: Readonly<Vector2D>;
}

export interface BallState {
  position: Vector3D;
  velocity: Vector3D;
  spin: Vector3D;
  ownerId: string | null;
  /** Son pas/şut temasını yapan oyuncu; top ondan uzaklaşana kadar self-pickup engellenir. */
  lastTouchId?: string | null;
  controlStrength: number;
}

export interface MatchState {
  readonly tickId: number;
  readonly ball: BallState;
  readonly players: ReadonlyMap<string, PlayerState>;
  readonly playerOrder: readonly string[];
}

export const matchTimeMs = (tickId: number, tickHz = 60): number =>
  Math.round((tickId * 1000) / tickHz);

export type MatchEvent =
  | { readonly type: 'pass'; readonly fromId: string; readonly toId: string | null; readonly success: boolean }
  | { readonly type: 'shot'; readonly playerId: string; readonly xG: number; readonly onTarget: boolean }
  | { readonly type: 'tackle'; readonly attackerId: string; readonly defenderId: string; readonly won: boolean }
  | { readonly type: 'ballLoss'; readonly fromId: string; readonly toId: string | null };

export interface MatchEventBatch {
  readonly tickId: number;
  readonly events: readonly MatchEvent[];
}

export interface GridControlMatrix {
  readonly width: number;
  readonly height: number;
  /** Q15 fixed-point: -32768 (away) .. +32767 (home) */
  readonly ownershipQ15: Int16Array;
  readonly tickId: number;
}

export interface IRandomSource {
  /** Deterministic value in [0, 1). */
  next(): number;
  /** Deterministic unsigned 32-bit integer. */
  nextUint32(): number;
}

export interface IRandomProvider {
  forAI(tickId: number): IRandomSource;
  forPhysics(tickId: number): IRandomSource;
  forEvents(tickId: number): IRandomSource;
}

export interface ISpatialAnalyzer {
  calculatePitchControl(state: DeepReadonly<MatchState>, resolution: number): GridControlMatrix;
}

export type PlayerIntent =
  | {
      readonly kind: 'move';
      readonly targetVelocity: Vector2D;
      readonly sprint: boolean;
    }
  | {
      readonly kind: 'pass';
      readonly targetVelocity: Vector2D;
      readonly sprint: boolean;
      readonly passTargetId: string;
      readonly passSpeed: number;
    }
  | {
      readonly kind: 'shoot';
      readonly targetVelocity: Vector2D;
      readonly sprint: boolean;
      readonly shootSpeed: number;
      readonly shootDirection: number;
      readonly shootSpin: Vector3D;
    }
  | {
      readonly kind: 'tackle';
      readonly targetVelocity: Vector2D;
      readonly sprint: boolean;
      readonly tackleTargetId: string;
    };

export interface IUtilityAI {
  decide(
    player: DeepReadonly<PlayerState>,
    state: DeepReadonly<MatchState>,
    control: GridControlMatrix,
    rng: IRandomSource
  ): PlayerIntent;
}

export interface IPhysicsEngine {
  step(
    current: Readonly<MatchState>,
    intents: ReadonlyMap<string, PlayerIntent>,
    next: MatchState,
    dt: number,
    rng: IRandomSource
  ): void;
}

export interface IEventDetector {
  detect(prev: DeepReadonly<MatchState>, next: DeepReadonly<MatchState>): readonly MatchEvent[];
}

export interface IEventStreamLogger {
  logBatch(batch: MatchEventBatch): void;
  exportStream(): readonly MatchEventBatch[];
}
