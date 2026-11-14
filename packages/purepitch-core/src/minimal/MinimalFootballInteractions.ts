import type {
  GoalkeepingAttributes,
  MentalAttributes,
  PlayerBody,
  TechnicalAttributes,
} from './MinimalFootballPhysics.js';

/** Small deterministic PRNG. Never uses Math.random(). */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    if (!Number.isInteger(seed)) throw new RangeError('seed must be an integer');
    this.state = seed >>> 0;
  }

  next(): number {
    // Mulberry32: compact, deterministic 32-bit generator.
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
}

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Independent deterministic streams. A player's decision cannot consume
 * random values intended for ball physics or match events.
 */
export class MatchRandomStreams {
  constructor(private readonly seed: number) {
    if (!Number.isInteger(seed)) throw new RangeError('seed must be an integer');
  }

  forPlayer(tickId: number, playerId: string): SeededRandom {
    return new SeededRandom(hashText(this.seed + '|player|' + tickId + '|' + playerId));
  }

  forPhysics(tickId: number): SeededRandom {
    return new SeededRandom(hashText(this.seed + '|physics|' + tickId));
  }

  forEvents(tickId: number): SeededRandom {
    return new SeededRandom(hashText(this.seed + '|events|' + tickId));
  }
}

export interface ProbabilityResult {
  readonly probability: number;
  readonly success: boolean;
}

export interface FirstTouchInput {
  readonly player: PlayerBody;
  readonly incomingSpeed: number;
  /** Absolute angle between the player's facing direction and incoming ball. */
  readonly approachAngleRadians: number;
  /** Nearest-opponent pressure, normalized to 0..1. */
  readonly pressure: number;
  readonly random: SeededRandom;
}

export interface FirstTouchResult extends ProbabilityResult {
  readonly retainedSpeed: number;
  readonly controlError: number;
}

export interface DribbleInput {
  readonly attacker: PlayerBody;
  readonly defender: PlayerBody;
  readonly defenderDistance: number;
  readonly relativeSpeed: number;
  readonly random: SeededRandom;
}

export interface PassInput {
  readonly passer: PlayerBody;
  readonly targetDistance: number;
  readonly pressure: number;
  readonly passingLaneObstruction: number;
  readonly random: SeededRandom;
}

export interface TackleInput {
  readonly tackler: PlayerBody;
  readonly carrier: PlayerBody;
  readonly contactDistance: number;
  readonly relativeSpeed: number;
  readonly random: SeededRandom;
}

export interface ShotInput {
  readonly shooter: PlayerBody;
  readonly goalkeeper: PlayerBody;
  readonly distance: number;
  /** Shooter's lateral offset from the centre of goal, in metres. */
  readonly lateralOffset: number;
  readonly pressure: number;
  readonly random: SeededRandom;
  readonly goalWidth?: number;
  readonly goalHeight?: number;
}

export interface ShotResult {
  readonly onTarget: boolean;
  readonly goal: boolean;
  readonly saved: boolean;
  readonly shotSpeed: number;
  readonly targetY: number;
  readonly targetZ: number;
  readonly onTargetProbability: number;
  readonly saveProbability: number;
}

export interface AttackerDecisionInput {
  readonly player: PlayerBody;
  readonly distanceToGoal: number;
  readonly defenderDistance: number;
  readonly shootingLaneOpen: boolean;
  readonly trigger: 'ball-controlled' | 'pressure-changed' | 'lane-opened';
  readonly random: SeededRandom;
}

export type AttackerDecision = 'shoot' | 'dribble';

/** Clamp external geometry/pressure inputs before using them in probabilities. */
function unit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function rating(value: number): number {
  return Math.max(1, Math.min(20, value));
}

/** Smoothly maps a rating advantage to a probability without hard guarantees. */
function skillProbability(advantage: number, base = 0.5): number {
  const bounded = Math.max(-12, Math.min(12, advantage));
  return unit(base + bounded * 0.035);
}

function requireGoalkeeper(player: PlayerBody): GoalkeepingAttributes {
  if (player.role !== 'goalkeeper' || player.goalkeeping === null) {
    throw new TypeError('goalkeeper attributes are required for this action');
  }
  return player.goalkeeping;
}

function triangular(random: SeededRandom): number {
  return random.next() - random.next();
}

/**
 * A first touch is evaluated only when the ball physically enters the
 * player's reachable control envelope. The caller owns contact detection.
 */
export function resolveFirstTouch(input: FirstTouchInput): FirstTouchResult {
  const firstTouch = rating(input.player.technical.firstTouch);
  const composure = rating(input.player.mental.composure);
  const agility = rating(input.player.physical.agility);
  const pressure = unit(input.pressure);
  const speedDifficulty = Math.max(0, input.incomingSpeed - 2.2) * 0.055;
  const angleDifficulty = Math.abs(input.approachAngleRadians) / Math.PI * 0.22;
  const pressureDifficulty = pressure * 0.24;
  const advantage = (firstTouch - 10) * 0.55
    + (composure - 10) * 0.2
    + (agility - 10) * 0.15
    - (speedDifficulty + angleDifficulty + pressureDifficulty) * 20;
  const probability = Math.max(0.04, Math.min(0.97, skillProbability(advantage, 0.64)));
  const success = input.random.next() < probability;
  const controlError = success
    ? Math.abs(triangular(input.random)) * (1.2 - firstTouch / 25)
    : 0.35 + Math.abs(triangular(input.random)) * (1.8 + pressure);
  return {
    probability,
    success,
    controlError,
    retainedSpeed: success
      ? input.incomingSpeed * (0.12 + (20 - firstTouch) * 0.012)
      : input.incomingSpeed * (0.55 + controlError * 0.18),
  };
}

export function resolveDribble(input: DribbleInput): ProbabilityResult {
  const attacker = input.attacker;
  const defender = input.defender;
  const distance = Math.max(0.05, input.defenderDistance);
  const proximityPressure = unit(1 - (distance - 0.45) / 2.8);
  const speedPressure = unit(input.relativeSpeed / 8);
  const advantage = (rating(attacker.technical.dribbling) - 10) * 0.55
    + (rating(attacker.physical.agility) - 10) * 0.25
    + (rating(attacker.physical.balance) - 10) * 0.2
    - (rating(defender.mental.anticipation) - 10) * 0.28
    - (rating(defender.physical.strength) - 10) * 0.18
    - proximityPressure * 5
    - speedPressure * 1.5;
  const probability = Math.max(0.03, Math.min(0.96, skillProbability(advantage, 0.57)));
  return { probability, success: input.random.next() < probability };
}

export function resolvePass(input: PassInput): ProbabilityResult {
  const passing = rating(input.passer.technical.passing);
  const vision = rating(input.passer.mental.vision);
  const decision = rating(input.passer.mental.decision);
  const distanceDifficulty = Math.max(0, input.targetDistance - 5) * 0.24;
  const pressureDifficulty = unit(input.pressure) * 4;
  const obstructionDifficulty = unit(input.passingLaneObstruction) * 7;
  const advantage = (passing - 10) * 0.5
    + (vision - 10) * 0.25
    + (decision - 10) * 0.25
    - distanceDifficulty - pressureDifficulty - obstructionDifficulty;
  const probability = Math.max(0.025, Math.min(0.97, skillProbability(advantage, 0.7)));
  return { probability, success: input.random.next() < probability };
}

export function resolveTackle(input: TackleInput): ProbabilityResult {
  const tackler = input.tackler;
  const carrier = input.carrier;
  const contactFactor = unit(1 - Math.max(0, input.contactDistance - 0.25) / 1.15);
  const speedRisk = unit(input.relativeSpeed / 10);
  const advantage = (rating(tackler.technical.tackling) - 10) * 0.48
    + (rating(tackler.physical.strength) - 10) * 0.24
    + (rating(tackler.mental.anticipation) - 10) * 0.28
    - (rating(carrier.technical.dribbling) - 10) * 0.25
    - (rating(carrier.physical.balance) - 10) * 0.2
    - (1 - contactFactor) * 12
    - speedRisk * 2;
  const probability = Math.max(0.015, Math.min(0.94, skillProbability(advantage, 0.48)));
  return { probability, success: input.random.next() < probability };
}

function goalkeeperSaveProbability(
  goalkeeper: PlayerBody,
  distance: number,
  shotSpeed: number,
  lateralReach: number,
  verticalReach: number,
): number {
  const keeper = requireGoalkeeper(goalkeeper);
  const oneOnOneWeight = distance < 12 ? 0.45 : 0.12;
  const reflexWeight = 0.32;
  const reachWeight = 0.23;
  const speedPenalty = Math.max(0, shotSpeed - 18) * 0.012;
  const reachPenalty = Math.max(0, lateralReach - (0.45 + keeper.aerialReach * 0.055)) * 0.09
    + Math.max(0, verticalReach - (0.65 + keeper.aerialReach * 0.06)) * 0.08;
  const oneOnOne = (rating(keeper.oneOnOnes) - 10) * oneOnOneWeight * 0.035;
  const reflex = (rating(keeper.reflexes) - 10) * reflexWeight * 0.035;
  const reach = (rating(keeper.aerialReach) - 10) * reachWeight * 0.025;
  return Math.max(0.025, Math.min(0.94, 0.43 + oneOnOne + reflex + reach - speedPenalty - reachPenalty));
}

/**
 * Samples shot placement and then keeper response. A high finishing rating
 * narrows the placement distribution; it never forces a goal.
 */
export function resolveShot(input: ShotInput): ShotResult {
  requireGoalkeeper(input.goalkeeper);
  const goalWidth = input.goalWidth ?? 7.32;
  const goalHeight = input.goalHeight ?? 2.44;
  const finishing = rating(input.shooter.technical.finishing);
  const longShots = rating(input.shooter.technical.longShots);
  const composure = rating(input.shooter.mental.composure);
  const distance = Math.max(1, input.distance);
  const pressure = unit(input.pressure);
  const longShotBlend = unit((distance - 12) / 18);
  const shootingSkill = finishing * (1 - longShotBlend) + longShots * longShotBlend;
  const accuracy = unit((shootingSkill * 0.7 + composure * 0.3) / 20);
  const distancePenalty = Math.max(0, distance - 10) * 0.012;
  const pressurePenalty = pressure * 0.11;
  const lateralError = triangular(input.random) * (0.24 + (1 - accuracy) * 1.05 + distancePenalty + pressurePenalty);
  const verticalError = triangular(input.random) * (0.16 + (1 - accuracy) * 0.7 + distancePenalty);
  const targetY = input.lateralOffset + lateralError * distance;
  const targetZ = Math.max(0.05, Math.min(goalHeight + 0.4, 0.82 + verticalError * distance * 0.42));
  const onTarget = Math.abs(targetY) <= goalWidth / 2 - 0.11 && targetZ <= goalHeight - 0.11;
  const onTargetProbability = Math.max(0.03, Math.min(0.97,
    0.91 - distancePenalty * 2.4 - pressurePenalty * 2.2 + (accuracy - 0.5) * 0.22));
  const shotSpeed = Math.max(8, Math.min(34, 15 + finishing * 0.48 + longShots * 0.16
    + input.random.next() * 2.2 - pressure * 1.8));
  const lateralReach = Math.abs(targetY);
  const verticalReach = targetZ;
  const saveProbability = onTarget
    ? goalkeeperSaveProbability(input.goalkeeper, distance, shotSpeed, lateralReach, verticalReach)
    : 0;
  const saved = onTarget && input.random.next() < saveProbability;
  return {
    onTarget,
    goal: onTarget && !saved,
    saved,
    shotSpeed,
    targetY,
    targetZ,
    onTargetProbability,
    saveProbability,
  };
}

/**
 * Decision is requested by a state transition, not by a recurring tick.
 * Decision/composure alter the chance of choosing the contextually sound
 * option; the result is sampled rather than selecting a maximum score.
 */
export function decideAttackerAction(input: AttackerDecisionInput): AttackerDecision {
  const distance = Math.max(0, input.distanceToGoal);
  const pressure = unit(1 - (input.defenderDistance - 0.5) / 4);
  const shootingOpportunity = unit((18 - distance) / 15)
    * (input.shootingLaneOpen ? 1 : 0.42);
  const dribbleOpportunity = unit(0.25 + pressure * 0.55 + (input.shootingLaneOpen ? 0 : 0.2));
  const decisionQuality = (rating(input.player.mental.decision)
    + rating(input.player.mental.vision)
    + rating(input.player.mental.composure)) / 60;
  const shootWeight = shootingOpportunity * (0.55 + decisionQuality * 0.45);
  const dribbleWeight = dribbleOpportunity * (0.9 - decisionQuality * 0.18);
  const total = shootWeight + dribbleWeight;
  const shootProbability = total > 0 ? shootWeight / total : 0.5;
  return input.random.next() < shootProbability ? 'shoot' : 'dribble';
}
