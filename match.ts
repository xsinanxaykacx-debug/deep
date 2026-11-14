
import type { PitchZone } from './pitch';
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

import { rng } from './chance';

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

    // Dakika başına 1-3 aksiyon.
    const actions = 1 + rng(3);

    for (
      let actionIndex = 0;
      actionIndex < actions;
      actionIndex++
    ) {
      const isHome = st.possession === 'home';

      const atk = isHome ? H : A;
      const def = isHome ? A : H;

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
        st.zone
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
          activeAtk
        );

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
          activeDef
        );
      } else {
        const style = isHome
          ? homeTeam.tactics.style
          : awayTeam.tactics.style;

        const target = choosePassTarget(
          st.zone,
          carrier,
          style
        );

        result = resolvePass(
          carrier,
          target,
          activeDef
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

      // Aksiyonun saha konumu uygulanır.
      st.zone = result.nextZone;

      // Topun kontrolü değişirse diğer takım oynar.
      if (result.possessionChange) {
        st.possession = isHome
          ? 'away'
          : 'home';
      }
    }

    // Kondisyon dakika başına yalnızca bir kez düşürülür.
    for (const item of H) {
      if (homeRedCards.has(item.player.id)) {
        continue;
      }

      item.player.condition = clamp(
        item.player.condition - 0.2,
        20,
        100
      );
    }

    for (const item of A) {
      if (awayRedCards.has(item.player.id)) {
        continue;
      }

      item.player.condition = clamp(
        item.player.condition - 0.2,
        20,
        100
      );
    }
  }

  return st;
}
