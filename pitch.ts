// ===== pitch.ts =====
export type PitchZone = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type PitchRow = 'defense' | 'midfield' | 'attacking_mid' | 'attack';
export type PitchLane = 'right' | 'center' | 'left';

export interface ZoneInfo {
  id: PitchZone;
  name: string;
  row: PitchRow;
  lane: PitchLane;
  mirrorZone: PitchZone;
}

export const PITCH_ZONES: Record<PitchZone, ZoneInfo> = {
  0: { id: 0, name: 'Sağ Defans', row: 'defense', lane: 'right', mirrorZone: 11 },
  1: { id: 1, name: 'Merkez Defans', row: 'defense', lane: 'center', mirrorZone: 10 },
  2: { id: 2, name: 'Sol Defans', row: 'defense', lane: 'left', mirrorZone: 9 },
  3: { id: 3, name: 'Sağ Orta Saha', row: 'midfield', lane: 'right', mirrorZone: 8 },
  4: { id: 4, name: 'Merkez Orta Saha', row: 'midfield', lane: 'center', mirrorZone: 7 },
  5: { id: 5, name: 'Sol Orta Saha', row: 'midfield', lane: 'left', mirrorZone: 6 },
  6: { id: 6, name: 'Sağ Ofansif Orta', row: 'attacking_mid', lane: 'right', mirrorZone: 5 },
  7: { id: 7, name: 'Orta Ofansif Orta', row: 'attacking_mid', lane: 'center', mirrorZone: 4 },
  8: { id: 8, name: 'Sol Ofansif Orta', row: 'attacking_mid', lane: 'left', mirrorZone: 3 },
  9: { id: 9, name: 'Sağ Atak', row: 'attack', lane: 'right', mirrorZone: 2 },
  10: { id: 10, name: 'Orta Atak (Ceza S.)', row: 'attack', lane: 'center', mirrorZone: 1 },
  11: { id: 11, name: 'Sol Atak', row: 'attack', lane: 'left', mirrorZone: 0 }
};

export const ZONE_NEIGHBORS: Record<PitchZone, PitchZone[]> = {
  0: [1, 3, 4],
  1: [0, 2, 3, 4, 5],
  2: [1, 4, 5],
  3: [0, 1, 4, 6, 7],
  4: [0, 1, 2, 3, 5, 6, 7, 8],
  5: [1, 2, 4, 7, 8],
  6: [3, 4, 7, 9, 10],
  7: [3, 4, 5, 6, 8, 9, 10, 11],
  8: [4, 5, 7, 10, 11],
  9: [6, 7, 10],
  10: [6, 7, 8, 9, 11],
  11: [7, 8, 10]
};
