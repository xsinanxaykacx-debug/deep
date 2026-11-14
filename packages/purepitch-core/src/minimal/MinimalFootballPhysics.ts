/**
 * Minimal football physics slice.
 *
 * First-stage scene: attacker, defender, goalkeeper, one ball, one goal.
 * This module contains continuous physical integration only. It does not
 * schedule passes, shots, dribbles, goals, or other events by tick number.
 */

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type PlayerRole = 'attacker' | 'defender' | 'goalkeeper';

/**
 * Football skills use a continuous 0..100 scale. They are not booleans:
 * later ball-control, duel, shooting and movement models consume these values.
 */
export interface OutfieldAttributes {
  readonly finishing: number; readonly heading: number; readonly dribbling: number;
  readonly firstTouch: number; readonly passing: number; readonly vision: number;
  readonly crossing: number; readonly longShots: number; readonly pace: number;
  readonly acceleration: number; readonly agility: number; readonly balance: number;
  readonly strength: number; readonly stamina: number; readonly workRate: number;
  readonly positioning: number; readonly anticipation: number; readonly composure: number;
  readonly jumping: number; readonly marking: number; readonly tackling: number;
  readonly interceptions: number;
}
export interface GoalkeeperAttributes {
  readonly reflexes: number; readonly oneOnOne: number; readonly positioning: number;
  readonly handling: number; readonly diving: number; readonly reach: number;
  readonly kicking: number; readonly distribution: number; readonly composure: number;
  readonly anticipation: number; readonly agility: number; readonly balance: number;
  readonly strength: number; readonly stamina: number; readonly jumping: number;
}
export interface PlayerProfile {
  readonly id: string; readonly name: string; readonly role: PlayerRole;
  /** A playing archetype, not a scripted action sequence. */
  readonly archetype: string;
  readonly attributes: OutfieldAttributes | GoalkeeperAttributes;
}
export interface PlayerBody extends PlayerProfile {
  readonly mass: number; readonly radius: number; readonly maxSpeed: number;
  readonly maxAcceleration: number; readonly position: Vec2; readonly velocity: Vec2;
}

export interface BallBody {
  readonly mass: number;
  readonly radius: number;
  readonly restitution: number;
  readonly rollingResistance: number;
  readonly airDrag: number;
  readonly position: Vec3;
  readonly velocity: Vec3;
}

export interface Goal {
  /** Goal plane; positive-x is the attacking direction in this first slice. */
  readonly x: number;
  readonly centerY: number;
  readonly width: number;
  readonly height: number;
}

export interface GoalEvent {
  readonly time: number;
  readonly crossingY: number;
  readonly crossingZ: number;
}

export interface MinimalScene {
  readonly time: number;
  readonly players: readonly PlayerBody[];
  readonly ball: BallBody;
  readonly goal: Goal;
  readonly goalEvent: GoalEvent | null;
}

export interface PlayerAcceleration {
  readonly x: number;
  readonly y: number;
}

export interface SceneControls {
  /**
   * Continuous acceleration inputs in m/s².
   * These are physical inputs, not action labels or scheduled events.
   */
  readonly playerAccelerations?: Readonly<Record<string, PlayerAcceleration>>;
}

export interface PhysicsParameters {
  readonly gravity: number;
  readonly playerRestitution: number;
  readonly playerBallRestitution: number;
  readonly groundRestitution: number;
  readonly groundHeight: number;
  readonly maximumSubstep: number;
}

export const DEFAULT_PARAMETERS: PhysicsParameters = {
  gravity: 9.81,
  playerRestitution: 0.12,
  playerBallRestitution: 0.28,
  groundRestitution: 0.42,
  groundHeight: 0,
  maximumSubstep: 1 / 120,
};

const EPSILON = 1e-9;

function clampMagnitude(vector: Vec2, maximum: number): Vec2 {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude <= maximum || magnitude <= EPSILON) return vector;
  const scale = maximum / magnitude;
  return { x: vector.x * scale, y: vector.y * scale };
}

function add2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subtract2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale2(vector: Vec2, scale: number): Vec2 {
  return { x: vector.x * scale, y: vector.y * scale };
}

function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function clonePlayer(player: PlayerBody): PlayerBody {
  return {
    ...player,
    position: { ...player.position },
    velocity: { ...player.velocity },
  };
}

export const MINIMAL_PLAYER_PROFILES: readonly PlayerProfile[] = [
  {
    id: 'attacker', name: 'Santrafor 9', role: 'attacker',
    archetype: 'Ceza sahası bitiricisi',
    attributes: {
      finishing: 84, heading: 78, dribbling: 76, firstTouch: 81,
      passing: 68, vision: 70, crossing: 52, longShots: 74,
      pace: 83, acceleration: 82, agility: 79, balance: 77,
      strength: 82, stamina: 76, workRate: 72, positioning: 88,
      anticipation: 85, composure: 86, jumping: 80,
      marking: 28, tackling: 34, interceptions: 31,
    },
  },
  {
    id: 'defender', name: 'Stoper 4', role: 'defender',
    archetype: 'Savunmacı stoper',
    attributes: {
      finishing: 42, heading: 85, dribbling: 58, firstTouch: 66,
      passing: 68, vision: 62, crossing: 38, longShots: 46,
      pace: 72, acceleration: 70, agility: 65, balance: 82,
      strength: 88, stamina: 82, workRate: 80, positioning: 87,
      anticipation: 88, composure: 74, jumping: 86,
      marking: 86, tackling: 84, interceptions: 85,
    },
  },
  {
    id: 'goalkeeper', name: 'Kaleci 1', role: 'goalkeeper',
    archetype: 'Çizgi kalecisi',
    attributes: {
      reflexes: 86, oneOnOne: 82, positioning: 84, handling: 79,
      diving: 85, reach: 83, kicking: 67, distribution: 68,
      composure: 80, anticipation: 84, agility: 75, balance: 78,
      strength: 74, stamina: 72, jumping: 78,
    },
  },
] as const;

function physicalSpeed(attributes: OutfieldAttributes | GoalkeeperAttributes): number {
  return 5.2 + ('pace' in attributes ? attributes.pace * 0.038 : attributes.agility * 0.025);
}
function physicalAcceleration(attributes: OutfieldAttributes | GoalkeeperAttributes): number {
  return 2.6 + ('acceleration' in attributes ? attributes.acceleration * 0.034 : attributes.agility * 0.025);
}
function createPlayer(profile: PlayerProfile, mass: number, position: Vec2): PlayerBody {
  return {
    ...profile, mass, radius: profile.role === 'goalkeeper' ? 0.25 : 0.24,
    maxSpeed: physicalSpeed(profile.attributes),
    maxAcceleration: physicalAcceleration(profile.attributes),
    position, velocity: { x: 0, y: 0 },
  };
}
export function createMinimalScene(): MinimalScene {
  const profiles = new Map(MINIMAL_PLAYER_PROFILES.map(profile => [profile.id, profile]));
  const players: PlayerBody[] = [
    createPlayer(profiles.get('attacker')!, 76, { x: 25, y: 0 }),
    createPlayer(profiles.get('defender')!, 81, { x: 36, y: 0.4 }),
    createPlayer(profiles.get('goalkeeper')!, 84, { x: 50.1, y: 0 }),
  ];
  return {
    time: 0, players,
    ball: {
      mass: 0.43, radius: 0.11, restitution: 0.42,
      rollingResistance: 0.18, airDrag: 0.012,
      position: { x: 25.28, y: 0, z: 0.11 },
      velocity: { x: 0, y: 0, z: 0 },
    },
    goal: { x: 52.5, centerY: 0, width: 7.32, height: 2.44 },
    goalEvent: null,
  };
}
function integratePlayer(
  player: PlayerBody,
  acceleration: PlayerAcceleration | undefined,
  dt: number,
): PlayerBody {
  const requested = acceleration ?? { x: 0, y: 0 };
  const applied = clampMagnitude(requested, player.maxAcceleration);
  const velocity = clampMagnitude(
    add2(player.velocity, scale2(applied, dt)),
    player.maxSpeed,
  );
  const position = add2(player.position, scale2(velocity, dt));

  return { ...player, position, velocity };
}

function resolvePlayerPair(a: PlayerBody, b: PlayerBody, restitution: number): [PlayerBody, PlayerBody] {
  const delta = subtract2(b.position, a.position);
  const distance = Math.hypot(delta.x, delta.y);
  const minimumDistance = a.radius + b.radius;
  if (distance >= minimumDistance) return [a, b];

  const normal = distance > EPSILON
    ? scale2(delta, 1 / distance)
    : { x: a.id < b.id ? 1 : -1, y: 0 };
  const penetration = minimumDistance - distance;
  const inverseMassA = 1 / a.mass;
  const inverseMassB = 1 / b.mass;
  const inverseMassSum = inverseMassA + inverseMassB;

  const correction = scale2(normal, penetration / inverseMassSum);
  let positionA = subtract2(a.position, scale2(correction, inverseMassA));
  let positionB = add2(b.position, scale2(correction, inverseMassB));

  const relativeVelocity = subtract2(b.velocity, a.velocity);
  const normalVelocity = dot2(relativeVelocity, normal);
  let velocityA = a.velocity;
  let velocityB = b.velocity;

  if (normalVelocity < 0) {
    const impulseMagnitude = -(1 + restitution) * normalVelocity / inverseMassSum;
    const impulse = scale2(normal, impulseMagnitude);
    velocityA = subtract2(velocityA, scale2(impulse, inverseMassA));
    velocityB = add2(velocityB, scale2(impulse, inverseMassB));
  }

  // Keep corrected positions finite and avoid aliasing input vectors.
  positionA = { x: positionA.x, y: positionA.y };
  positionB = { x: positionB.x, y: positionB.y };
  return [
    { ...a, position: positionA, velocity: velocityA },
    { ...b, position: positionB, velocity: velocityB },
  ];
}

function resolvePlayerCollisions(players: readonly PlayerBody[], restitution: number): PlayerBody[] {
  const result = players.map(clonePlayer);
  // A few solver passes reduce residual overlap in crowded contact situations.
  for (let pass = 0; pass < 3; pass += 1) {
    for (let i = 0; i < result.length; i += 1) {
      for (let j = i + 1; j < result.length; j += 1) {
        const [a, b] = resolvePlayerPair(result[i], result[j], restitution);
        result[i] = a;
        result[j] = b;
      }
    }
  }
  return result;
}

function resolvePlayerBallContact(
  players: readonly PlayerBody[],
  ball: BallBody,
  restitution: number,
): BallBody {
  let position = { ...ball.position };
  let velocity = { ...ball.velocity };

  for (const player of players) {
    // A player body is a vertical cylinder. Only the lower body can contact
    // a ball close enough to the ground in this first-stage model.
    if (position.z > player.radius + ball.radius + 0.12) continue;

    const delta = { x: position.x - player.position.x, y: position.y - player.position.y };
    const distance = Math.hypot(delta.x, delta.y);
    const minimumDistance = player.radius + ball.radius;
    if (distance >= minimumDistance) continue;

    const normal = distance > EPSILON
      ? { x: delta.x / distance, y: delta.y / distance }
      : { x: player.id.length % 2 === 0 ? 1 : -1, y: 0 };
    const penetration = minimumDistance - distance;
    position = {
      ...position,
      x: position.x + normal.x * penetration,
      y: position.y + normal.y * penetration,
    };

    const relativeVelocity = {
      x: velocity.x - player.velocity.x,
      y: velocity.y - player.velocity.y,
    };
    const normalVelocity = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;
    if (normalVelocity < 0) {
      const inverseMassSum = 1 / ball.mass + 1 / player.mass;
      const impulseMagnitude = -(1 + restitution) * normalVelocity / inverseMassSum;
      velocity = {
        ...velocity,
        x: velocity.x + normal.x * impulseMagnitude / ball.mass,
        y: velocity.y + normal.y * impulseMagnitude / ball.mass,
      };
    }
  }

  return { ...ball, position, velocity };
}

function integrateBall(
  ball: BallBody,
  dt: number,
  parameters: PhysicsParameters,
): BallBody {
  let vx = ball.velocity.x;
  let vy = ball.velocity.y;
  let vz = ball.velocity.z - parameters.gravity * dt;

  let x = ball.position.x + vx * dt;
  let y = ball.position.y + vy * dt;
  let z = ball.position.z + vz * dt;

  if (z <= parameters.groundHeight + ball.radius) {
    z = parameters.groundHeight + ball.radius;
    if (vz < 0) {
      vz = -vz * Math.min(ball.restitution, parameters.groundRestitution);
    }

    const horizontalSpeed = Math.hypot(vx, vy);
    const reducedSpeed = Math.max(0, horizontalSpeed - ball.rollingResistance * dt);
    if (horizontalSpeed > EPSILON) {
      const scale = reducedSpeed / horizontalSpeed;
      vx *= scale;
      vy *= scale;
    }
  } else {
    const drag = Math.exp(-ball.airDrag * dt);
    vx *= drag;
    vy *= drag;
    vz *= drag;
  }

  return {
    ...ball,
    position: { x, y, z },
    velocity: { x: vx, y: vy, z: vz },
  };
}

function detectGoalCrossing(
  previous: BallBody,
  next: BallBody,
  goal: Goal,
  time: number,
): GoalEvent | null {
  if (!(previous.position.x < goal.x && next.position.x >= goal.x)) return null;

  const dx = next.position.x - previous.position.x;
  const fraction = Math.abs(dx) > EPSILON
    ? (goal.x - previous.position.x) / dx
    : 0;
  const crossingY = previous.position.y + (next.position.y - previous.position.y) * fraction;
  const crossingZ = previous.position.z + (next.position.z - previous.position.z) * fraction;
  const insidePosts = Math.abs(crossingY - goal.centerY) <= goal.width / 2 - next.radius;
  const belowBar = crossingZ <= goal.height - next.radius;

  return insidePosts && belowBar
    ? { time, crossingY, crossingZ }
    : null;
}

export function stepMinimalScene(
  current: MinimalScene,
  controls: SceneControls,
  dt: number,
  parameters: PhysicsParameters = DEFAULT_PARAMETERS,
): MinimalScene {
  if (!Number.isFinite(dt) || dt <= 0) {
    throw new RangeError('dt must be a finite positive number');
  }

  const substepCount = Math.max(1, Math.ceil(dt / parameters.maximumSubstep));
  const h = dt / substepCount;
  let scene: MinimalScene = {
    ...current,
    players: current.players.map(clonePlayer),
    ball: { ...current.ball, position: { ...current.ball.position }, velocity: { ...current.ball.velocity } },
    goalEvent: current.goalEvent,
  };

  for (let substep = 0; substep < substepCount && scene.goalEvent === null; substep += 1) {
    const previousBall = scene.ball;
    const movedPlayers = scene.players.map(player =>
      integratePlayer(player, controls.playerAccelerations?.[player.id], h),
    );
    const separatedPlayers = resolvePlayerCollisions(movedPlayers, parameters.playerRestitution);
    const movedBall = integrateBall(scene.ball, h, parameters);
    const contactedBall = resolvePlayerBallContact(
      separatedPlayers,
      movedBall,
      parameters.playerBallRestitution,
    );
    const nextTime = scene.time + h;
    const goalEvent = detectGoalCrossing(previousBall, contactedBall, scene.goal, nextTime);

    scene = {
      ...scene,
      time: nextTime,
      players: separatedPlayers,
      ball: contactedBall,
      goalEvent,
    };
  }

  return scene;
}
