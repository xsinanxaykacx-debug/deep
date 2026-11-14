
import type { PitchZone } from './pitch';
import { PITCH_ZONES } from './pitch';
import type { Team } from './core';

import {
  resolveLineup,
  pickBallCarrier
} from './core';

import {
  resolvePass,
  resolveShot,
  resolveDribble,
  resolveCross,
  chooseAction,
  choosePassTarget
} from './rules';

import { rng, chance } from './chance';

export interface MatchStats {
  homeScore: number;
  awayScore: number;

  homeShots: number;
  awayShots: number;

  homeCorners: number;
  awayCorners: number;

  homeFouls: number;
  awayFouls: number;

  homeYellowCards: number;
  awayYellowCards: number;

  homeRedCards: number;
  awayRedCards: number;
}

export interface MatchState {
  minute: number;
  zone: PitchZone;
  possession: 'home' | 'away';
  stats: MatchStats;
  events: string[];
}

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Simülasyon için takımın oyuncularını kopyalar.
 * Böylece maç sırasında kondisyon değişiklikleri
 * orijinal takım kadrosunu etkilemez.
 */
function cloneTeam(team: Team): Team {
  return {
    ...team,
    tactics: { ...team.tactics },
    players: team.players.map(player => ({
      ...player,
      attributes: { ...player.attributes }
    })),
    startingXI: [...team.startingXI],
    bench: [...team.bench]
  };
}

export function simulateMatch(
  home: Team,
  away: Team
): MatchState {
  // Orijinal takımlar korunur.
  const homeTeam = cloneTeam(home);
  const awayTeam = cloneTeam(away);

  const H = resolveLineup(homeTeam);
  const A = resolveLineup(awayTeam);

  // Maç başlangıcında kondisyon eşitlenir.
  for (const lineup of [H, A]) {
    for (const item of lineup) {
      item.player.condition = 95;
    }
  }

  const stats: MatchStats = {
    homeScore: 0,
    awayScore: 0,

    homeShots: 0,
    awayShots: 0,

    homeCorners: 0,
    awayCorners: 0,

    homeFouls: 0,
    awayFouls: 0,

    homeYellowCards: 0,
    awayYellowCards: 0,

    homeRedCards: 0,
    awayRedCards: 0
  };

  const st: MatchState = {
    minute: 0,
    zone: 4,
    possession: 'home',
    stats,
    events: []
  };

  const homeRedCards = new Set<string>();
  const awayRedCards = new Set<string>();

  const homeYellowCards = new Map<string, number>();
  const awayYellowCards = new Map<string, number>();

  const totalMinutes = 90 + rng(4);

  for (let min = 1; min <= totalMinutes; min++) {
    st.minute = min;

    // Tempo aksiyon sıklığını etkiler; yüksek tempo daha çok aksiyon,
    // düşük tempo daha kontrollü ve yavaş oyun üretir.
    const activeTeam = st.possession === 'home' ? homeTeam : awayTeam;
    const tempo = clamp(activeTeam.tactics.tempo ?? 50, 0, 100);
    let actions = 1 + rng(3);
    if (tempo > 55 && chance((tempo - 55) / 180)) {
      actions = Math.min(4, actions + 1);
    } else if (tempo < 45 && chance((45 - tempo) / 180)) {
      actions = Math.max(1, actions - 1);
    }

    for (
      let actionIndex = 0;
      actionIndex < actions;
      actionIndex++
    ) {
      const isHome = st.possession === 'home';

      const atk = isHome ? H : A;
      const def = isHome ? A : H;
      const attackingTeam = isHome ? homeTeam : awayTeam;
      const defendingTeam = isHome ? awayTeam : homeTeam;

      const attackingRedCards = isHome
        ? homeRedCards
        : awayRedCards;

      const defendingRedCards = isHome
        ? awayRedCards
        : homeRedCards;

      // Kırmızı kartlı oyuncular oyundan çıkarılır.
      const activeAtk = atk.filter(
        item => !attackingRedCards.has(item.player.id)
      );

      const activeDef = def.filter(
        item => !defendingRedCards.has(item.player.id)
      );

      if (activeAtk.length === 0) {
        break;
      }

      const carrier = pickBallCarrier(
        st.zone,
        activeAtk
      );

      if (!carrier) {
        st.zone = 4;
        continue;
      }

      const action = chooseAction(
        carrier,
        st.zone,
        attackingTeam.tactics
      );

      let result: ReturnType<typeof resolveShot>;

      if (action === 'shot') {
        result = resolveShot(
          carrier,
          st.zone,
          activeDef
        );

        if (isHome) {
          stats.homeShots++;
        } else {
          stats.awayShots++;
        }

        if (result.goal) {
          if (isHome) {
            stats.homeScore++;
          } else {
            stats.awayScore++;
          }

          st.events.push(
            `${min}' ${result.text}`
          );
        }
      } else if (action === 'cross') {
        result = resolveCross(
          carrier,
          st.zone,
          activeDef,
          activeAtk,
          defendingTeam.tactics
        );

        if (result.isShot) {
          if (isHome) stats.homeShots++;
          else stats.awayShots++;
        }

        if (result.isCorner) {
          if (isHome) {
            stats.homeCorners++;
          } else {
            stats.awayCorners++;
          }
        }

        if (result.goal) {
          if (isHome) {
            stats.homeScore++;
          } else {
            stats.awayScore++;
          }

          st.events.push(
            `${min}' ${result.text}`
          );
        }
      } else if (action === 'dribble') {
        result = resolveDribble(
          carrier,
          st.zone,
          activeDef,
          defendingTeam.tactics
        );
      } else {
        const target = choosePassTarget(
          st.zone,
          carrier,
          attackingTeam.tactics
        );

        result = resolvePass(
          carrier,
          target,
          activeDef,
          defendingTeam.tactics,
          st.zone
        );
      }

      // Faul ve kart kontrolü.
      if (result.isFoul) {
        // Faul yapan takım savunma yapan takımdır.
        if (isHome) {
          stats.awayFouls++;
        } else {
          stats.homeFouls++;
        }

        const offender = activeDef.find(
          item => item.player.id === result.foulPlayerId
        )?.player;

        if (result.isCard === 'yellow') {
          if (isHome) {
            stats.awayYellowCards++;
          } else {
            stats.homeYellowCards++;
          }

          if (offender) {
            const yellowCards = isHome
              ? awayYellowCards
              : homeYellowCards;

            const previousCards =
              yellowCards.get(offender.id) ?? 0;

            const currentCards = previousCards + 1;

            yellowCards.set(
              offender.id,
              currentCards
            );

            // İkinci sarı kart kırmızı karta dönüşür.
            if (currentCards >= 2) {
              if (isHome) {
                stats.awayRedCards++;
                awayRedCards.add(offender.id);
              } else {
                stats.homeRedCards++;
                homeRedCards.add(offender.id);
              }

              st.events.push(
                `${min}' İkinci sarı karttan kırmızı kart!`
              );
            }
          }
        } else if (result.isCard === 'red') {
          if (isHome) {
            stats.awayRedCards++;

            if (offender) {
              awayRedCards.add(offender.id);
            }
          } else {
            stats.homeRedCards++;

            if (offender) {
              homeRedCards.add(offender.id);
            }
          }

          st.events.push(
            `${min}' Kırmızı kart!`
          );
        }
      }

      // Sonuç bölgesi topa sahip olan takımın hücum yönüne göre tutulur.
      if (result.possessionChange) {
        st.possession = isHome ? 'away' : 'home';

        if (result.goal) {
          // Gol sonrası santra.
          st.zone = 4 as PitchZone;
        } else if (action === 'shot') {
          // Kaleci kontrolü veya aut sonrası kale önü başlangıcı.
          st.zone = 1 as PitchZone;
        } else {
          // Pas/çalım/orta kaynaklı top kaybında saha yönünü çevir.
          st.zone = PITCH_ZONES[result.nextZone].mirrorZone;
        }
      } else {
        st.zone = result.nextZone;
      }
    }

    // Kondisyon dakika başına yalnızca bir kez düşürülür.
    for (const item of H) {
      if (homeRedCards.has(item.player.id)) {
        continue;
      }

      const fatigue = 0.14 +
        clamp(homeTeam.tactics.pressing, 0, 100) * 0.00045 +
        clamp(homeTeam.tactics.tempo, 0, 100) * 0.00025;
      item.player.condition = clamp(
        item.player.condition - fatigue,
        20,
        100
      );
    }

    for (const item of A) {
      if (awayRedCards.has(item.player.id)) {
        continue;
      }

      const fatigue = 0.14 +
        clamp(awayTeam.tactics.pressing, 0, 100) * 0.00045 +
        clamp(awayTeam.tactics.tempo, 0, 100) * 0.00025;
      item.player.condition = clamp(
        item.player.condition - fatigue,
        20,
        100
      );
    }
  }

  return st;
}
