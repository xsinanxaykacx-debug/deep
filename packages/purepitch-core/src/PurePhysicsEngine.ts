// PurePitch Engine v5 — deterministik oyuncu aksiyonlarını fiziksel olarak uygular.
// AI karar vermez; motor yalnızca PlayerIntent içindeki açık aksiyonu yürütür.

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
    for (const id of next.playerOrder) {
      const srcPlayer = current.players.get(id)!;
      const intent = intents.get(id) || {
        kind: 'move' as const,
        targetVelocity: { x: 0, y: 0 },
        sprint: false
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
      // attributes ve roleAnchor salt okunur sözleşmedir; motor bunları mutasyona uğratmaz.
      // Buffer allocator bu immutable alanlar için referans paylaşabilir; değişiklikte yeni nesne atanmalıdır.
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

    // 3. ADIM: Top fiziği — mevcut sahibin ayağına yerleştirir veya serbest topu ilerletir.
    this.updateBallPhysics(current.ball, next, dt, rng);

    // 4. ADIM: Serbest ve alçak top için deterministik pickup.
    this.resolvePickup(next);

    // 5. ADIM: Güncel top sahibine karşı gelen deterministik tackle'lar.
    this.resolveTackles(intents, next);

    // 6. ADIM: Tackle sonrası hâlâ top sahibi olan oyuncunun pası/şutu.
    this.processOwnerAction(intents, next);
  }

  private resolvePickup(next: MatchState): void {
    const ball = next.ball;
    if (ball.ownerId !== null || ball.position.z > 0.5) return;

    const pickupRadius = this.config.playerRadius;
    const pickupRadiusSq = pickupRadius * pickupRadius;

    // Pası/şutu atan oyuncu, top ayağından fiziksel olarak uzaklaşana kadar
    // kendi bıraktığı topu aynı tick döngüsünde anında geri alamaz.
    if (ball.lastTouchId) {
      const lastToucher = next.players.get(ball.lastTouchId);
      if (lastToucher) {
        const dx = ball.position.x - lastToucher.position.x;
        const dy = ball.position.y - lastToucher.position.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= pickupRadiusSq + 1e-9) return;
      }
      ball.lastTouchId = null;
    }

    let bestId: string | null = null;
    let bestDistSq = Infinity;

    // playerOrder deterministik tie-break sırasıdır.
    // Küçük tolerans, çarpışma çözümünden gelen kayan nokta sınır hatalarını önler.
    for (const id of next.playerOrder) {
      const player = next.players.get(id);
      if (!player) continue;

      const dx = ball.position.x - player.position.x;
      const dy = ball.position.y - player.position.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > pickupRadiusSq + 1e-9) continue;

      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestId = id;
      }
    }

    if (bestId === null) return;

    const picker = next.players.get(bestId);
    if (!picker) return;

    ball.ownerId = bestId;
    ball.lastTouchId = null;
    ball.controlStrength = 1.0;
    ball.velocity = { x: picker.velocity.x, y: picker.velocity.y, z: 0 };
    ball.position.x = picker.position.x;
    ball.position.y = picker.position.y;
    ball.position.z = 0.1;
    ball.spin = { x: 0, y: 0, z: 0 };
  }

  private processOwnerAction(
    intents: ReadonlyMap<string, PlayerIntent>,
    next: MatchState
  ): void {
    const ownerId = next.ball.ownerId;
    if (!ownerId) return;

    const intent = intents.get(ownerId);
    if (!intent) return;

    switch (intent.kind) {
      case 'move':
      case 'tackle':
        return;

      case 'pass': {
        const owner = next.players.get(ownerId);
        const target = next.players.get(intent.passTargetId);
        if (!owner || !target || !Number.isFinite(intent.passSpeed) || intent.passSpeed < 0) return;

        const dx = target.position.x - owner.position.x;
        const dy = target.position.y - owner.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1e-6) return;

        next.ball.lastTouchId = ownerId;
        next.ball.velocity = {
          x: (dx / dist) * intent.passSpeed,
          y: (dy / dist) * intent.passSpeed,
          z: 0
        };
        next.ball.ownerId = null;
        next.ball.controlStrength = 0;
        next.ball.spin = { x: 0, y: 0, z: 0 };
        return;
      }

      case 'shoot':
        if (!Number.isFinite(intent.shootSpeed) || intent.shootSpeed < 0 ||
            !Number.isFinite(intent.shootDirection)) return;
        next.ball.lastTouchId = ownerId;
        next.ball.velocity = {
          x: Math.cos(intent.shootDirection) * intent.shootSpeed,
          y: Math.sin(intent.shootDirection) * intent.shootSpeed,
          z: 0
        };
        next.ball.spin = { ...intent.shootSpin };
        next.ball.ownerId = null;
        next.ball.controlStrength = 0;
        return;
    }
  }

  private resolveTackles(
    intents: ReadonlyMap<string, PlayerIntent>,
    next: MatchState
  ): void {
    // Pickup sonrasında topun güncel sahibi hedef alınır.
    const ownerId = next.ball.ownerId;
    if (!ownerId) return;

    const owner = next.players.get(ownerId);
    if (!owner) return;

    const range = this.config.playerRadius * 2;
    const rangeSq = range * range;

    // playerOrder sırası deterministik tie-break kuralıdır.
    for (const id of next.playerOrder) {
      if (id === ownerId) continue;

      const intent = intents.get(id);
      if (!intent || intent.kind !== 'tackle' || intent.tackleTargetId !== ownerId) continue;

      const tackler = next.players.get(id);
      if (!tackler || tackler.teamId === owner.teamId) continue;

      const dx = owner.position.x - tackler.position.x;
      const dy = owner.position.y - tackler.position.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > rangeSq + 1e-9) continue;

      next.ball.ownerId = id;
      next.ball.controlStrength = 1;
      next.ball.velocity = { x: tackler.velocity.x, y: tackler.velocity.y, z: 0 };
      next.ball.position.x = tackler.position.x + Math.cos(tackler.facing) * this.config.ballOffset;
      next.ball.position.y = tackler.position.y + Math.sin(tackler.facing) * this.config.ballOffset;
      next.ball.position.z = 0.1;
      next.ball.spin = { x: 0, y: 0, z: 0 };
      return;
    }
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

    // 1. Dikey hız ve yerçekimi: Magnus hesabında kullanılacak vz bu tick'e aittir.
    let vz = prevBall.velocity.z - gravity * dt;
    let z = prevBall.position.z + vz * dt;

    // 2. Zemin çarpışması dikey hız güncellemesinden sonra çözülür.
    if (z <= 1e-4 && vz < 0) {
      z = 0;
      vz = -vz * this.config.restitution;
    }

    // 3. Yatay hızın tick başındaki değerleri alınır. Magnus çapraz çarpımı
    //    tek bir ara hız vektörü (vx, vy, vz) üzerinden hesaplanır.
    let vx = prevBall.velocity.x;
    let vy = prevBall.velocity.y;
    const k = this.config.magnusCoefficient;

    const spinCrossVelX = prevBall.spin.y * vz - prevBall.spin.z * vy;
    const spinCrossVelY = prevBall.spin.z * vx - prevBall.spin.x * vz;
    const spinCrossVelZ = prevBall.spin.x * vy - prevBall.spin.y * vx;

    // 4. Hava kaynaklı Magnus ivmesi uygulanır.
    vx += k * spinCrossVelX * dt;
    vy += k * spinCrossVelY * dt;
    vz += k * spinCrossVelZ * dt;

    // 5. Zemin sürtünmesi yalnızca yatay bileşenlere uygulanır.
    vx *= this.config.groundFriction;
    vy *= this.config.groundFriction;

    // 6. Konum, son hızlardan güncellenir.
    ball.position.x = prevBall.position.x + vx * dt;
    ball.position.y = prevBall.position.y + vy * dt;
    ball.position.z = Math.max(0, z);

    ball.velocity = { x: vx, y: vy, z: vz };
    ball.spin = { ...prevBall.spin };
    ball.ownerId = null;
    ball.controlStrength = Math.max(0, prevBall.controlStrength - 0.1 * dt);
  }
}
