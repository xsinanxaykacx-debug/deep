// Bit düzeyinde deterministik state hash — gerçek FNV-1a 64-bit.
// - Float'lar IEEE 754 byte dizisine çevrilir.
// - -0 ve +0 ayrımı korunur, NaN kanonikleştirilir.
// - String'ler UTF-16 code unit olarak yazılır (length + 2 byte/char).
// - Sıra: tickId, ball (sabit alan sırası), playerOrder sırasıyla oyuncular.
//
// Determinizm sınırı: aynı Node.js sürümü + aynı CPU mimarisi.
// Çapraz platform bit düzeyinde eşitlik GARANTİ EDİLMEZ (Math.atan2, Math.sin
// implementasyonları farklı olabilir).

import type { MatchState } from '../../src/purepitch_v3.js';

const FNV_OFFSET_BASIS_LO = 0x84222325;
const FNV_OFFSET_BASIS_HI = 0xcbf29ce4;
const FNV_PRIME_LO = 0x000001b3;
const FNV_PRIME_HI = 0x00000100;

/**
 * Gerçek FNV-1a 64-bit — 32-bit parçalı aritmetik (BigInt'ten hızlı).
 * Çıktı: 16 karakter hex (big-endian).
 * Test vektörü: fnv1a64(utf8("hello")) === "a430d84680aabd0b"
 */
export function fnv1a64(bytes: Uint8Array): string {
  let lo = FNV_OFFSET_BASIS_LO >>> 0;
  let hi = FNV_OFFSET_BASIS_HI >>> 0;

  for (let i = 0; i < bytes.length; i++) {
    lo = (lo ^ bytes[i]) >>> 0;

    // 64-bit çarpma: (hi:lo) * (prime_hi:prime_lo) mod 2^64
    // lo * prime_lo: lo <= 2^32-1, prime_lo ≈ 2^8 → çarpım <= 2^40 < 2^53 (güvenli)
    const loProd = lo * FNV_PRIME_LO;
    const loLow = loProd >>> 0;
    const loCarry = Math.floor(loProd / 0x100000000) >>> 0;

    // hi * prime_lo + lo * prime_hi + carry, her biri <= 2^40, toplam <= 2^42 (güvenli)
    const hiProd = (hi * FNV_PRIME_LO + lo * FNV_PRIME_HI + loCarry) >>> 0;

    lo = loLow;
    hi = hiProd;
  }

  return hi.toString(16).padStart(8, '0') + lo.toString(16).padStart(8, '0');
}

/** State'i deterministik byte dizisine çevirir. */
export function stateToBytes(state: MatchState): Uint8Array {
  const chunks: Uint8Array[] = [];
  const f64Buf = new ArrayBuffer(8);
  const f64View = new DataView(f64Buf);

  const pushF64 = (v: number): void => {
    let bits: bigint;
    if (Number.isNaN(v)) {
      bits = 0x7FF8000000000000n;
    } else if (v === 0) {
      bits = Object.is(v, -0) ? 0x8000000000000000n : 0n;
    } else {
      f64View.setFloat64(0, v, false);
      bits = f64View.getBigUint64(0, false);
    }
    f64View.setBigUint64(0, bits, false);
    // Kopyala (buffer yeniden kullanılıyor)
    chunks.push(new Uint8Array(f64Buf.slice(0)));
  };

  const pushU32 = (v: number): void => {
    const b = new ArrayBuffer(4);
    new DataView(b).setUint32(0, v >>> 0, false);
    chunks.push(new Uint8Array(b));
  };

  const pushStr = (s: string): void => {
    const b = new ArrayBuffer(4 + s.length * 2);
    const dv = new DataView(b);
    dv.setUint32(0, s.length, false);
    for (let i = 0; i < s.length; i++) {
      dv.setUint16(4 + i * 2, s.charCodeAt(i), false);
    }
    chunks.push(new Uint8Array(b));
  };

  pushU32(state.tickId);

  // Ball — sabit alan sırası
  pushF64(state.ball.position.x);
  pushF64(state.ball.position.y);
  pushF64(state.ball.position.z);
  pushF64(state.ball.velocity.x);
  pushF64(state.ball.velocity.y);
  pushF64(state.ball.velocity.z);
  pushF64(state.ball.spin.x);
  pushF64(state.ball.spin.y);
  pushF64(state.ball.spin.z);
  pushStr(state.ball.ownerId ?? '');
  pushF64(state.ball.controlStrength);

  // Oyuncular — playerOrder sırasıyla
  for (const id of state.playerOrder) {
    const p = state.players.get(id);
    if (!p) {
      pushStr('MISSING');
      continue;
    }
    pushStr(p.id);
    pushStr(p.teamId);
    pushF64(p.position.x);
    pushF64(p.position.y);
    pushF64(p.velocity.x);
    pushF64(p.velocity.y);
    pushF64(p.stamina);
    // v4'te facing PlayerState tipinde yok — cast ile okuyoruz.
    // v5'te tipe eklenince bu cast kalkacak ve golden-master yenilenecek.
    pushF64((p as { facing?: number }).facing ?? 0);
    // Immutable alanlar da hash'e girer — referans sızıntısı tespiti için.
    pushF64(p.attributes.maxSpeed);
    pushF64(p.attributes.acceleration);
    pushF64(p.attributes.agility);
    pushF64(p.attributes.staminaMax);
    pushF64(p.attributes.passingSkill);
    pushF64(p.attributes.shootingSkill);
    pushF64(p.roleAnchor.x);
    pushF64(p.roleAnchor.y);
  }

  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

export function hashState(state: MatchState): string {
  return fnv1a64(stateToBytes(state));
}

// ---------- Diff ----------

export interface StateDiff {
  readonly field: string;
  readonly prev: number | string | boolean | null;
  readonly next: number | string | boolean | null;
}

export function diffState(a: MatchState, b: MatchState): StateDiff[] {
  const diffs: StateDiff[] = [];

  const push = (field: string, av: unknown, bv: unknown): void => {
    if (av === bv) return;
    if (typeof av === 'number' && typeof bv === 'number') {
      if (Number.isNaN(av) && Number.isNaN(bv)) return;
      if (Object.is(av, bv)) return; // -0 vs +0 farkını yakalar
    }
    diffs.push({
      field,
      prev: (av ?? null) as number | string | boolean | null,
      next: (bv ?? null) as number | string | boolean | null,
    });
  };

  push('tickId', a.tickId, b.tickId);

  push('ball.pos.x', a.ball.position.x, b.ball.position.x);
  push('ball.pos.y', a.ball.position.y, b.ball.position.y);
  push('ball.pos.z', a.ball.position.z, b.ball.position.z);
  push('ball.vel.x', a.ball.velocity.x, b.ball.velocity.x);
  push('ball.vel.y', a.ball.velocity.y, b.ball.velocity.y);
  push('ball.vel.z', a.ball.velocity.z, b.ball.velocity.z);
  push('ball.spin.x', a.ball.spin.x, b.ball.spin.x);
  push('ball.spin.y', a.ball.spin.y, b.ball.spin.y);
  push('ball.spin.z', a.ball.spin.z, b.ball.spin.z);
  push('ball.ownerId', a.ball.ownerId, b.ball.ownerId);
  push('ball.controlStrength', a.ball.controlStrength, b.ball.controlStrength);

  for (const id of a.playerOrder) {
    const pa = a.players.get(id);
    const pb = b.players.get(id);
    if (!pa || !pb) {
      diffs.push({
        field: `player[${id}].present`,
        prev: pa ? true : false,
        next: pb ? true : false,
      });
      continue;
    }
    push(`player[${id}].pos.x`, pa.position.x, pb.position.x);
    push(`player[${id}].pos.y`, pa.position.y, pb.position.y);
    push(`player[${id}].vel.x`, pa.velocity.x, pb.velocity.x);
    push(`player[${id}].vel.y`, pa.velocity.y, pb.velocity.y);
    push(`player[${id}].stamina`, pa.stamina, pb.stamina);
    push(`player[${id}].facing`, (pa as { facing?: number }).facing ?? 0, (pb as { facing?: number }).facing ?? 0);
  }

  return diffs;
}

// ---------- Hash uzunluk kontrolü ----------

export function assertHashFormat(h: string): void {
  if (!/^[0-9a-f]{16}$/.test(h)) {
    throw new Error(`Hash formatı geçersiz (16 hex bekleniyor): ${h}`);
  }
}

// ---------- Self-test (test dosyasından bağımsız çağrılabilir) ----------

export function selfTestFnv(): void {
  const encoder = new TextEncoder();
  const vec = encoder.encode('hello');
  const got = fnv1a64(vec);
  const expected = 'a430d84680aabd0b';
  if (got !== expected) {
    throw new Error(`FNV-1a 64 test vektörü başarısız: got=${got}, expected=${expected}`);
  }
}
