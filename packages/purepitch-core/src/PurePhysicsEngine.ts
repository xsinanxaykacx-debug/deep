// PurePitch Engine v4 — mevcut konuşma kaynağının baseline kopyası.
// Golden test bu sürümün davranışını sabitlemek için kullanılacaktır.
// Bilinen kusurlar (readonly cast, any, fizik kalibrasyonu, actionType'in
// uygulanmaması ve rng'nin kullanılmaması) bu baseline'da kasıtlı olarak korunur.

import {
  MatchState, PlayerIntent, IRandomSource, IPhysicsEngine, BallState
} from './purepitch_v3.js';

export interface PhysicsConfig {
  readonly playerRadius: number;
  readonly maxAcceleration: number;
  readonly groundFriction: number;
  readonly ballOffset: number;
  readonly restitution: number;
  readonly magnusCoefficient: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  playerRadius: 0.45,
  maxAcceleration: 8.0,
  groundFriction: 0.98,
  ballOffset: 0.4,
  restitution: 0.5,
  magnusCoefficient: 0.002
};

export class PurePhysicsEngine implements IPhysicsEngine {
  constructor(private readonly config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG) {}

  public step(
    current: Readonly<MatchState>,
    intents: ReadonlyMap<string, PlayerIntent>,
    next: MatchState,
    dt: number,
    rng: IRandomSource
  ): void {
    const nextTick = current.tickId + 1;
    (next as { tickId: number }).tickId = nextTick;

    // 1. ADIM: Oyuncu fizik güncellemesi
    for (const id of current.playerOrder) {
      const srcPlayer = current.players.get(id)!;
      const intent = intents.get(id) || {
        targetVelocity: { x: 0, y: 0 },
        sprint: false,
        actionType: 'move' as const
      };

      const targetVel = intent.targetVelocity;
      const maxSpeed = intent.sprint
        ? srcPlayer.attributes.maxSpeed * 1.2
        : srcPlayer.attributes.maxSpeed;

      const targetSpeed = Math.sqrt(targetVel.x * targetVel.x + targetVel.y * targetVel.y);
      const clampedSpeed = targetSpeed > maxSpeed ? maxSpeed : targetSpeed;
      const normalizedTarget = targetSpeed > 0.0001
        ? { x: (targetVel.x / targetSpeed) * clampedSpeed, y: (targetVel.y / targetSpeed) * clampedSpeed }
        : { x: 0, y: 0 };

      const dvx = normalizedTarget.x - srcPlayer.velocity.x;
      const dvy = normalizedTarget.y - srcPlayer.velocity.y;
      const dvMag = Math.sqrt(dvx * dvx + dvy * dvy);

      const effectiveAccel = Math.min(srcPlayer.attributes.acceleration, this.config.maxAcceleration);
      const maxDv = effectiveAccel * dt;
      const appliedDvMag = dvMag > maxDv ? maxDv : dvMag;

      const newVel = dvMag > 0.0001
        ? {
            x: srcPlayer.velocity.x + (dvx / dvMag) * appliedDvMag,
            y: srcPlayer.velocity.y + (dvy / dvMag) * appliedDvMag
          }
        : { x: srcPlayer.velocity.x, y: srcPlayer.velocity.y };

      const newPos = {
        x: srcPlayer.position.x + newVel.x * dt,
        y: srcPlayer.position.y + newVel.y * dt
      };

      const speed = Math.sqrt(newVel.x * newVel.x + newVel.y * newVel.y);
      const facing = speed > 0.1 ? Math.atan2(newVel.y, newVel.x) : srcPlayer.facing;

      const targetPlayerState = next.players.get(id)!;
      targetPlayerState.position = newPos;
      targetPlayerState.velocity = newVel;
      targetPlayerState.facing = facing;
      targetPlayerState.stamina = Math.max(
        0,
        srcPlayer.stamina - (intent.sprint ? 0.05 : 0.01) * dt
      );
    }

    // 2. ADIM: Sıralı silindirik çarpışma ve impulse
    this.resolveCylindricalCollisions(next);

    // 3. ADIM: Top fiziği
    this.updateBallPhysics(current.ball, next, dt, rng);
  }

  private resolveCylindricalCollisions(next: MatchState): void {
    const ids = next.playerOrder;
    const len = ids.length;
    const minDist = this.config.playerRadius * 2;

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const p1 = next.players.get(ids[i])!;
        const p2 = next.players.get(ids[j])!;

        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const distSq = dx * dx + dy * dy;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq) {
          let nx = 1;
          let ny = 0;
          const dist = Math.sqrt(distSq);

          if (distSq < 1e-8) {
            const sign = ids[i] < ids[j] ? 1 : -1;
            p1.position.x -= sign * this.config.playerRadius * 0.5;
            p2.position.x += sign * this.config.playerRadius * 0.5;
            continue;
          }

          nx = dx / dist;
          ny = dy / dist;

          const overlap = minDist - dist;
          const correction = overlap * 0.5;
          p1.position.x -= nx * correction;
          p1.position.y -= ny * correction;
          p2.position.x += nx * correction;
          p2.position.y += ny * correction;

          const relVelX = p2.velocity.x - p1.velocity.x;
          const relVelY = p2.velocity.y - p1.velocity.y;
          const velAlongNormal = relVelX * nx + relVelY * ny;

          if (velAlongNormal < 0) {
            const m1 = (p1.attributes as any).strength || 1;
            const m2 = (p2.attributes as any).strength || 1;
            const jImpulse = -(1 + this.config.restitution) * velAlongNormal / ((1 / m1) + (1 / m2));

            p1.velocity.x -= (jImpulse / m1) * nx;
            p1.velocity.y -= (jImpulse / m1) * ny;
            p2.velocity.x += (jImpulse / m2) * nx;
            p2.velocity.y += (jImpulse / m2) * ny;
          }
        }
      }
    }
  }

  private updateBallPhysics(prevBall: BallState, next: MatchState, dt: number, rng: IRandomSource): void {
    const ball = next.ball;

    if (prevBall.ownerId) {
      const owner = next.players.get(prevBall.ownerId);
      if (owner) {
        const facing = owner.facing;
        const dirX = Math.cos(facing);
        const dirY = Math.sin(facing);

        ball.position.x = owner.position.x + dirX * this.config.ballOffset;
        ball.position.y = owner.position.y + dirY * this.config.ballOffset;
        ball.position.z = 0.1;
        ball.velocity = { x: owner.velocity.x, y: owner.velocity.y, z: 0 };
        ball.ownerId = prevBall.ownerId;
        ball.controlStrength = 1.0;
        ball.spin = { x: 0, y: 0, z: 0 };
        return;
      }
    }

    const gravity = 9.81;
    let vz = prevBall.velocity.z - gravity * dt;
    let z = prevBall.position.z + vz * dt;

    if (z <= 1e-4 && vz < 0) {
      z = 0;
      vz = -vz * this.config.restitution;
    }

    const k = this.config.magnusCoefficient;
    const spinCrossVelX = prevBall.spin.y * vz - prevBall.spin.z * prevBall.velocity.y;
    const spinCrossVelY = prevBall.spin.z * prevBall.velocity.x - prevBall.spin.x * vz;
    const spinCrossVelZ = prevBall.spin.x * prevBall.velocity.y - prevBall.spin.y * prevBall.velocity.x;

    const vx = (prevBall.velocity.x + k * spinCrossVelX * dt) * this.config.groundFriction;
    const vy = (prevBall.velocity.y + k * spinCrossVelY * dt) * this.config.groundFriction;
    const finalVz = vz + k * spinCrossVelZ * dt;

    ball.position.x = prevBall.position.x + vx * dt;
    ball.position.y = prevBall.position.y + vy * dt;
    ball.position.z = Math.max(0, z);

    ball.velocity = { x: vx, y: vy, z: finalVz };
    ball.spin = { ...prevBall.spin };
    ball.ownerId = null;
    ball.controlStrength = Math.max(0, prevBall.controlStrength - 0.1 * dt);
  }
}
