import type {
  DeepReadonly,
  GridControlMatrix,
  ISpatialAnalyzer,
  MatchState,
} from './purepitch_v3.js';

const PITCH_LENGTH = 105;
const PITCH_WIDTH = 68;
const MIN_PLAYER_SPEED = 0.1;
const HOME_Q15 = 32767;
const AWAY_Q15 = -32767;

interface SpatialPlayer {
  readonly x: number;
  readonly y: number;
  readonly speed: number;
  readonly teamId: 'home' | 'away';
}

/**
 * Deterministic nearest-arrival-time ownership classification.
 *
 * Q15 output is categorical, not a probability:
 * +32767 = home, -32767 = away, 0 = no team / out-of-pitch cell.
 */
export class SpatialAnalyzer implements ISpatialAnalyzer {
  public calculatePitchControl(
    state: DeepReadonly<MatchState>,
    resolution: number,
  ): GridControlMatrix {
    if (!Number.isFinite(resolution) || resolution <= 0) {
      throw new Error('resolution pozitif sonlu olmalı');
    }

    const width = Math.ceil(PITCH_LENGTH / resolution);
    const height = Math.ceil(PITCH_WIDTH / resolution);
    const cellCount = width * height;

    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
        !Number.isSafeInteger(cellCount) || cellCount <= 0) {
      throw new Error('resolution geçerli bir grid boyutu üretmiyor');
    }

    const ownershipQ15 = new Int16Array(cellCount);
    const playerData: SpatialPlayer[] = [];
    const seenIds = new Set<string>();

    if (state.playerOrder.length !== state.players.size) {
      throw new Error('playerOrder ve players boyutları tutarsız');
    }

    for (const id of state.playerOrder) {
      if (seenIds.has(id)) {
        throw new Error(`playerOrder yinelenen oyuncu içeriyor: ${id}`);
      }
      seenIds.add(id);

      const player = state.players.get(id);
      if (!player) {
        throw new Error(`playerOrder tutarsız: ${id}`);
      }
      if (player.id !== id) {
        throw new Error(`players anahtarı ve oyuncu id eşleşmiyor: ${id}`);
      }
      if (player.teamId !== 'home' && player.teamId !== 'away') {
        throw new Error(`geçersiz teamId: ${String(player.teamId)}`);
      }

      const x = player.position.x;
      const y = player.position.y;
      const maxSpeed = player.attributes.maxSpeed;

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`geçersiz oyuncu konumu: ${id}`);
      }
      if (!Number.isFinite(maxSpeed)) {
        throw new Error(`geçersiz maxSpeed: ${id}`);
      }

      playerData.push({
        x,
        y,
        speed: Math.max(maxSpeed, MIN_PLAYER_SPEED),
        teamId: player.teamId,
      });
    }

    for (let gy = 0; gy < height; gy++) {
      const worldY = (gy + 0.5) * resolution;
      if (worldY > PITCH_WIDTH) continue;

      for (let gx = 0; gx < width; gx++) {
        const worldX = (gx + 0.5) * resolution;
        if (worldX > PITCH_LENGTH) continue;

        let bestTime = Infinity;
        let bestTeamId: 'home' | 'away' | null = null;

        // Strict < preserves the first player in playerOrder on exact ties.
        for (const player of playerData) {
          const dx = worldX - player.x;
          const dy = worldY - player.y;
          const distSq = dx * dx + dy * dy;
          const time = Math.sqrt(distSq) / player.speed;

          if (time < bestTime) {
            bestTime = time;
            bestTeamId = player.teamId;
          }
        }

        if (bestTeamId === 'home') {
          ownershipQ15[gy * width + gx] = HOME_Q15;
        } else if (bestTeamId === 'away') {
          ownershipQ15[gy * width + gx] = AWAY_Q15;
        }
      }
    }

    return {
      width,
      height,
      cellSize: resolution,
      ownershipQ15,
      tickId: state.tickId,
    };
  }
}
