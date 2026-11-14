import type { PitchZone } from './pitch';
import type { Team, FormationSlot } from './core';
import { resolveLineup, pickBallCarrier } from './core';
import {
  resolvePass, resolveShot, resolveDribble, resolveCross,
  choosePassTarget, skill, findDefender
} from './rules';
import { rng, chance, roll } from './chance';
import type { Player } from './player';

type LineupEntry = { player: Player; slot: FormationSlot };
type Side = 'home' | 'away';

export interface MatchStats {
  homeScore: number;
  awayScore: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeSaves: number;
  awaySaves: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls: number;
  awayFouls: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  homePasses: number;
  awayPasses: number;
  homePassesCompleted: number;
  awayPassesCompleted: number;
  homePossessionMinutes: number;
  awayPossessionMinutes: number;
  homeTackles: number;
  awayTackles: number;
  homeOffsides: number;
  awayOffsides: number;
  homeSubstitutions: number;
  awaySubstitutions: number;
}

export interface MatchState {
  minute: number;
  zone: PitchZone;
  possession: Side;
  stats: MatchStats;
  events: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

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

function activeLineup(lineup: LineupEntry[], sentOff: Set<string>): LineupEntry[] {
  return lineup.filter(item => !sentOff.has(item.player.id));
}

function getCarrier(
  lineup: LineupEntry[],
  zone: PitchZone,
  previousId: string | null
): Player | null {
  if (previousId) {
    const previous = lineup.find(item => item.player.id === previousId);
    if (previous && previous.player.position !== 'GK') {
      const fit = previous.slot.primaryZone === zone ||
        Math.abs(previous.slot.primaryZone - zone) <= 3;
      if (fit && chance(0.72)) return previous.player;
    }
  }
  return pickBallCarrier(zone, lineup);
}

function pressureLevel(
  zone: PitchZone,
  defenders: LineupEntry[],
  tactics: Team['tactics']
): number {
  const defender = findDefender(zone, defenders);
  if (!defender) return 0;
  const pressing = clamp(tactics.pressing, 0, 100);
  const defensiveSkill = (
    skill(defender, 'positioning') +
    skill(defender, 'marking') +
    skill(defender, 'workRate')
  ) / 3;
  return clamp((defensiveSkill / 20) * 0.55 + (pressing / 100) * 0.45, 0, 1);
}

function chooseContextualAction(
  carrier: Player,
  zone: PitchZone,
  pressure: number,
  tactics: Team['tactics'],
  attackCount: number
): 'pass' | 'shot' | 'dribble' | 'cross' {
  const shooting = skill(carrier, 'shooting');
  const dribbling = skill(carrier, 'dribbling');
  const vision = skill(carrier, 'vision');
  const decisions = skill(carrier, 'decisions');
  const wide = zone === 9 || zone === 11;
  const centralThreat = zone === 10 || zone === 7;
  const style = tactics.style;

  // Şut ancak saha bölgesi, oyuncu profili ve baskı birlikte uygunsa seçilir.
  if (zone === 10) {
    const shotChance = clamp(
      0.16 + (shooting - 10) * 0.012 +
      (decisions - 10) * 0.006 - pressure * 0.18 +
      (tactics.tempo - 50) * 0.001,
      0.04, 0.48
    );
    if (chance(shotChance)) return 'shot';
  }
  if ((zone === 9 || zone === 11) && shooting >= 13 && pressure < 0.58 &&
      chance(clamp(0.04 + (shooting - 12) * 0.012, 0.03, 0.18))) {
    return 'shot';
  }
  if (zone >= 6 && zone <= 8 && shooting >= 15 && pressure < 0.35 &&
      chance(0.035 + (shooting - 15) * 0.006)) {
    return 'shot';
  }

  // Kanat oyuncuları, baskı ve orta yeteneğine göre orta arar.
  if (wide && zone >= 6 && skill(carrier, 'crossing') >= 10) {
    const crossChance = clamp(
      0.12 + (skill(carrier, 'crossing') - 10) * 0.018 +
      (style === 'wing_play' ? 0.14 : 0) -
      pressure * 0.12 - attackCount * 0.012,
      0.04, 0.48
    );
    if (chance(crossChance)) return 'cross';
  }

  // Çalım: teknik oyuncu, boş alan ve bire bir fırsatı arar.
  const dribbleChance = clamp(
    0.06 + (dribbling - 10) * 0.012 +
    (skill(carrier, 'agility') - 10) * 0.005 -
    pressure * 0.12 -
    (style === 'possession' ? 0.035 : 0),
    0.02, 0.30
  );
  if (chance(dribbleChance)) return 'dribble';

  // Yüksek baskıda riskli pas yerine yakın/geri pası tercih et.
  if (pressure > 0.72 && vision < 12 && chance(0.38)) return 'pass';
  return 'pass';
}

function applySubstitution(
  team: Team,
  lineup: LineupEntry[],
  sentOff: Set<string>,
  minute: number,
  usedSubs: Set<string>,
  side: Side,
  stats: MatchStats,
  events: string[]
): void {
  if (minute < 58 || usedSubs.size >= 5 || team.bench.length === 0) return;

  const candidates = lineup
    .filter(item => item.player.position !== 'GK' &&
      !sentOff.has(item.player.id) &&
      item.player.condition < (minute >= 75 ? 86 : 90))
    .sort((a, b) => a.player.condition - b.player.condition);

  if (candidates.length === 0) return;

  const tired = candidates[0];
  const replacement = team.bench
    .filter(id => !usedSubs.has(id) && !lineup.some(item => item.player.id === id))
    .map(id => team.players.find(player => player.id === id))
    .filter((player): player is Player => !!player && player.position !== 'GK')
    .map(player => ({
      player,
      fit: player.position === tired.slot.position ||
        player.altPositions?.includes(tired.slot.position) ? 1 :
        player.position === 'CM' || player.position === 'AM' ? 0.65 : 0.35
    }))
    .sort((a, b) => b.fit * (0.6 + b.player.condition / 250) -
      a.fit * (0.6 + a.player.condition / 250))[0];

  if (!replacement || replacement.fit < 0.3) return;

  const oldName = tired.player.name;
  tired.player = replacement.player;
  tired.player.condition = Math.max(78, tired.player.condition);
  usedSubs.add(replacement.player.id);
  team.bench = team.bench.filter(id => id !== replacement.player.id);

  if (side === 'home') stats.homeSubstitutions++;
  else stats.awaySubstitutions++;
  events.push(`${minute}' ${oldName} çıktı, ${replacement.player.name} oyunda.`);
}

function updateCondition(
  lineup: LineupEntry[],
  carrierId: string | null,
  pressing: number,
  tempo: number,
  sentOff: Set<string>
): void {
  for (const item of lineup) {
    if (sentOff.has(item.player.id)) continue;
    const involved = item.player.id === carrierId;
    const workload = 0.055 + pressing * 0.00055 + tempo * 0.00025 +
      (involved ? 0.045 : 0);
    item.player.condition = clamp(item.player.condition - workload, 35, 100);
  }
}

export function simulateMatch(home: Team, away: Team): MatchState {
  const homeTeam = cloneTeam(home);
  const awayTeam = cloneTeam(away);
  const H = resolveLineup(homeTeam);
  const A = resolveLineup(awayTeam);

  for (const item of [...H, ...A]) item.player.condition = 100;

  const stats: MatchStats = {
    homeScore: 0, awayScore: 0,
    homeShots: 0, awayShots: 0,
    homeShotsOnTarget: 0, awayShotsOnTarget: 0,
    homeSaves: 0, awaySaves: 0,
    homeCorners: 0, awayCorners: 0,
    homeFouls: 0, awayFouls: 0,
    homeYellowCards: 0, awayYellowCards: 0,
    homeRedCards: 0, awayRedCards: 0,
    homePasses: 0, awayPasses: 0,
    homePassesCompleted: 0, awayPassesCompleted: 0,
    homePossessionMinutes: 0, awayPossessionMinutes: 0,
    homeTackles: 0, awayTackles: 0,
    homeOffsides: 0, awayOffsides: 0,
    homeSubstitutions: 0, awaySubstitutions: 0
  };

  const st: MatchState = {
    minute: 0, zone: 4, possession: 'home', stats, events: []
  };

  const sentOffHome = new Set<string>();
  const sentOffAway = new Set<string>();
  const yellowsHome = new Map<string, number>();
  const yellowsAway = new Map<string, number>();
  const usedSubsHome = new Set<string>();
  const usedSubsAway = new Set<string>();

  let carrierId: string | null = null;
  let possessionSequence = 0;
  let consecutivePasses = 0;
  let attackCount = 0;
  let lastPossession: Side = 'home';
  const totalMinutes = 90 + rng(4);

  for (let minute = 1; minute <= totalMinutes; minute++) {
    st.minute = minute;

    if (st.possession !== lastPossession) {
      possessionSequence = 0;
      consecutivePasses = 0;
      attackCount = 0;
      carrierId = null;
      lastPossession = st.possession;
    }

    applySubstitution(homeTeam, H, sentOffHome, minute, usedSubsHome,
      'home', stats, st.events);
    applySubstitution(awayTeam, A, sentOffAway, minute, usedSubsAway,
      'away', stats, st.events);

    // Takım gerideyse son bölümde tempo ve baskı yükselir; öndeyse blok daralır.
    if (minute >= 65) {
      if (stats.homeScore < stats.awayScore) {
        homeTeam.tactics.tempo = clamp(homeTeam.tactics.tempo + 0.35, 0, 100);
        homeTeam.tactics.pressing = clamp(homeTeam.tactics.pressing + 0.3, 0, 100);
      }
      if (stats.awayScore < stats.homeScore) {
        awayTeam.tactics.tempo = clamp(awayTeam.tactics.tempo + 0.35, 0, 100);
        awayTeam.tactics.pressing = clamp(awayTeam.tactics.pressing + 0.3, 0, 100);
      }
    }

    if (st.possession === 'home') stats.homePossessionMinutes++;
    else stats.awayPossessionMinutes++;

    // Dakika başına bir ana karar; başarılı paslar sonraki dakikalarda
    // aynı hücum sekansını ve saha bölgesini korur.
    const isHome = st.possession === 'home';
    const atk = isHome ? H : A;
    const def = isHome ? A : H;
    const attackingSentOff = isHome ? sentOffHome : sentOffAway;
    const defendingSentOff = isHome ? sentOffAway : sentOffHome;
    const attackingTeam = isHome ? homeTeam : awayTeam;
    const defendingTeam = isHome ? awayTeam : homeTeam;
    const activeAtk = activeLineup(atk, attackingSentOff);
    const activeDef = activeLineup(def, defendingSentOff);

    if (activeAtk.length === 0) continue;

    const carrier = getCarrier(activeAtk, st.zone, carrierId);
    if (!carrier) {
      st.zone = 4;
      carrierId = null;
      st.possession = isHome ? 'away' : 'home';
      continue;
    }
    carrierId = carrier.id;
    const pressure = pressureLevel(st.zone, activeDef, defendingTeam.tactics);

    // Ev sahibi avantajı küçük bir karar/rahatlık etkisi; doğrudan gol bonusu değil.
    const homeComfort = isHome ? 0.025 : 0;
    const action = chooseContextualAction(
      carrier, st.zone, Math.max(0, pressure - homeComfort),
      attackingTeam.tactics, attackCount
    );

    let result: ReturnType<typeof resolveShot>;
    if (action === 'shot') {
      result = resolveShot(carrier, st.zone, activeDef);
      if (result.goal) {
        if (isHome) stats.homeScore++; else stats.awayScore++;
        st.events.push(`${minute}' ${result.text}`);
      }
    } else if (action === 'cross') {
      result = resolveCross(carrier, st.zone, activeDef, activeAtk, defendingTeam.tactics);
      if (result.isCorner) {
        if (isHome) stats.homeCorners++; else stats.awayCorners++;
        // Korner hücumu aynı takımda kalır, top ceza alanına taşınır.
        st.zone = 10;
        carrierId = null;
      }
      if (result.goal) {
        if (isHome) stats.homeScore++; else stats.awayScore++;
        st.events.push(`${minute}' ${result.text}`);
      }
    } else if (action === 'dribble') {
      result = resolveDribble(carrier, st.zone, activeDef, defendingTeam.tactics);
      if (!result.success && !result.isFoul) {
        if (isHome) stats.awayTackles++; else stats.homeTackles++;
      }
    } else {
      const target = choosePassTarget(st.zone, carrier, attackingTeam.tactics);
      if (isHome) stats.homePasses++; else stats.awayPasses++;

      // Son savunma çizgisinin arkasına erken koşu: ofsayt riski.
      const attackingThird = target >= 9;
      const throughBall = target > st.zone && target - st.zone >= 2;
      const defensiveDepth = clamp(defendingTeam.tactics.depth, 0, 100);
      const offsideChance = attackingThird && throughBall
        ? clamp(0.025 + defensiveDepth * 0.00065 -
          skill(carrier, 'decisions') * 0.001, 0.015, 0.09)
        : 0;
      if (offsideChance > 0 && chance(offsideChance)) {
        result = {
          success: false, nextZone: target, possessionChange: true,
          isFoul: false, text: `Ofsayt: ${carrier.name}`
        };
        if (isHome) stats.homeOffsides++; else stats.awayOffsides++;
        st.events.push(`${minute}' Ofsayt: ${carrier.name}`);
      } else {
        result = resolvePass(carrier, target, activeDef, defendingTeam.tactics);
        if (result.success) {
          if (isHome) stats.homePassesCompleted++; else stats.awayPassesCompleted++;
          consecutivePasses++;
        }
      }
    }

    if (result.isShot) {
      if (isHome) stats.homeShots++; else stats.awayShots++;
    }
    if (result.onTarget) {
      if (isHome) stats.homeShotsOnTarget++; else stats.awayShotsOnTarget++;
    }
    if (result.saved) {
      if (isHome) stats.awaySaves++; else stats.homeSaves++;
    }

    if (result.isFoul) {
      if (isHome) stats.awayFouls++; else stats.homeFouls++;
      const offender = activeDef.find(item => item.player.id === result.foulPlayerId)?.player;
      const defendingYellow = isHome ? yellowsAway : yellowsHome;
      const defendingSentOffSet = isHome ? sentOffAway : sentOffHome;

      if (result.isCard === 'yellow') {
        if (isHome) stats.awayYellowCards++; else stats.homeYellowCards++;
        if (offender) {
          const count = (defendingYellow.get(offender.id) ?? 0) + 1;
          defendingYellow.set(offender.id, count);
          if (count >= 2) {
            defendingSentOffSet.add(offender.id);
            if (isHome) stats.awayRedCards++; else stats.homeRedCards++;
            st.events.push(`${minute}' İkinci sarıdan kırmızı kart!`);
          }
        }
      } else if (result.isCard === 'red') {
        if (isHome) stats.awayRedCards++; else stats.homeRedCards++;
        if (offender) defendingSentOffSet.add(offender.id);
        st.events.push(`${minute}' Kırmızı kart!`);
      }
      // Duran top: faul hücum bölgesindeyse serbest vuruş konumu korunur.
      st.zone = result.nextZone;
      carrierId = null;
      possessionSequence++;
      continue;
    }

    st.zone = result.nextZone;
    attackCount++;
    possessionSequence++;

    if (result.possessionChange) {
      st.possession = isHome ? 'away' : 'home';
      carrierId = null;
      consecutivePasses = 0;
      attackCount = 0;
    } else if (result.isShot) {
      // Şut sonrası kaleci kontrolü ve yeni hücum başlangıcı.
      st.possession = isHome ? 'away' : 'home';
      carrierId = null;
      consecutivePasses = 0;
      attackCount = 0;
    } else if (result.isCorner) {
      st.possession = isHome ? 'home' : 'away';
    } else {
      // Başarılı pas/çalımda takım topu ve hücum sekansını korur.
      carrierId = null;
    }

    // Yüksek pres top kaybı yaratabilir; kondisyon ve pres seviyesi birlikte etkiler.
    if (!result.possessionChange && !result.isShot && !result.isCorner &&
        defendingTeam.tactics.pressing >= 65 &&
        chance(0.008 + defendingTeam.tactics.pressing * 0.00022 + pressure * 0.018)) {
      st.possession = isHome ? 'away' : 'home';
      st.zone = Math.max(0, st.zone - 1) as PitchZone;
      carrierId = null;
      if (isHome) stats.awayTackles++; else stats.homeTackles++;
    }

    updateCondition(H, isHome ? carrier.id : null,
      homeTeam.tactics.pressing, homeTeam.tactics.tempo, sentOffHome);
    updateCondition(A, isHome ? null : carrier.id,
      awayTeam.tactics.pressing, awayTeam.tactics.tempo, sentOffAway);
  }

  return st;
}
