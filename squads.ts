// ===== squads.ts =====
import type { Player, PlayerAttributes, Position } from './player';
import type { Team, Formation, TacticStyle } from './core';
import { TEAM_POWERS } from './teamPower';

function baseAttrs(o: Partial<PlayerAttributes> = {}): PlayerAttributes {
  return {
    passing: 12, longPassing: 12, crossing: 10, shooting: 10, dribbling: 12, technique: 12,
    tackling: 10, marking: 10, heading: 10, vision: 12, positioning: 12, decisions: 12, composure: 12,
    pace: 12, stamina: 13, strength: 12, agility: 12, workRate: 13, aggression: 12,
    goalkeeping: 1, reflexes: 1, ...o,
  };
}

// ── GS gerçek kadro ────────────────────────────────────────
const GS_SQUAD: Player[] = [
  { id: 'gs_ugurcan',  name: 'Uğurcan Çakır', position: 'GK', condition: 90, morale: 82, attributes: baseAttrs({ goalkeeping: 17, reflexes: 16, positioning: 16 }) },
  { id: 'gs_gunay',    name: 'Günay Güvenç',  position: 'GK', condition: 90, morale: 70, attributes: baseAttrs({ goalkeeping: 14, reflexes: 14 }) },
  { id: 'gs_sanchez',  name: 'Davinson Sánchez', position: 'CB', condition: 90, morale: 82, attributes: baseAttrs({ tackling: 17, marking: 16, heading: 16, strength: 17, pace: 15 }) },
  { id: 'gs_bardakci', name: 'Abdülkerim Bardakcı', position: 'CB', condition: 90, morale: 78, attributes: baseAttrs({ tackling: 15, marking: 15, heading: 15, passing: 14 }) },
  { id: 'gs_jakobs',   name: 'Ismail Jakobs',  position: 'LB', condition: 90, morale: 77, attributes: baseAttrs({ pace: 16, crossing: 15, passing: 14, workRate: 15 }) },
  { id: 'gs_singo',    name: 'Wilfried Singo', position: 'RB', condition: 90, morale: 78, attributes: baseAttrs({ pace: 17, tackling: 15, workRate: 16, crossing: 13 }) },
  { id: 'gs_torreira', name: 'Lucas Torreira', position: 'DM', condition: 90, morale: 84, attributes: baseAttrs({ tackling: 17, marking: 16, passing: 15, vision: 14, workRate: 18, aggression: 16 }) },
  { id: 'gs_ilkay',    name: 'İlkay Gündoğan', position: 'CM', condition: 90, morale: 84, attributes: baseAttrs({ passing: 18, vision: 17, technique: 17, decisions: 17, composure: 17, shooting: 14 }) },
  { id: 'gs_sara',     name: 'Gabriel Sara',   position: 'CM', condition: 90, morale: 80, attributes: baseAttrs({ passing: 16, vision: 16, technique: 16, shooting: 14 }) },
  { id: 'gs_lang',     name: 'Noa Lang',       position: 'RW', condition: 90, morale: 80, attributes: baseAttrs({ pace: 17, dribbling: 16, shooting: 14, crossing: 14, technique: 15 }) },
  { id: 'gs_sane',     name: 'Leroy Sané',     position: 'LW', condition: 90, morale: 82, attributes: baseAttrs({ pace: 18, dribbling: 17, shooting: 15, crossing: 15, technique: 17 }) },
  { id: 'gs_osimhen',  name: 'Victor Osimhen', position: 'ST', condition: 90, morale: 88, attributes: baseAttrs({ shooting: 18, heading: 17, positioning: 18, composure: 17, strength: 17, pace: 17 }) },
  { id: 'gs_yunus',    name: 'Yunus Akgün',    position: 'AM', condition: 90, morale: 78, attributes: baseAttrs({ passing: 15, vision: 15, technique: 16, dribbling: 15, shooting: 13 }) },
  { id: 'gs_icardi',   name: 'Mauro Icardi',   position: 'ST', condition: 90, morale: 84, attributes: baseAttrs({ shooting: 18, heading: 16, positioning: 18, composure: 17 }) },
  { id: 'gs_baris',    name: 'Barış Alper Yılmaz', position: 'RW', condition: 90, morale: 78, attributes: baseAttrs({ pace: 18, workRate: 16, dribbling: 14, crossing: 13 }) },
  { id: 'gs_lemia',    name: 'Mario Lemina',   position: 'DM', condition: 90, morale: 76, attributes: baseAttrs({ tackling: 15, marking: 14, passing: 13, workRate: 15 }) },
  { id: 'gs_berkan',   name: 'Berkan Kutlu',   position: 'CM', condition: 90, morale: 74, attributes: baseAttrs({ passing: 13, stamina: 16, workRate: 15 }) },
];

// ── FB gerçek kadro ────────────────────────────────────────
const FB_SQUAD: Player[] = [
  { id: 'fb_ederson',  name: 'Ederson',        position: 'GK', condition: 90, morale: 84, attributes: baseAttrs({ goalkeeping: 18, reflexes: 17, positioning: 17 }) },
  { id: 'fb_mertg',    name: 'Mert Günok',     position: 'GK', condition: 90, morale: 70, attributes: baseAttrs({ goalkeeping: 14, reflexes: 14 }) },
  { id: 'fb_skriniar', name: 'Milan Škriniar', position: 'CB', condition: 90, morale: 82, attributes: baseAttrs({ tackling: 17, marking: 17, heading: 17, strength: 17 }) },
  { id: 'fb_ake',      name: 'Nathan Aké',     position: 'CB', condition: 90, morale: 80, attributes: baseAttrs({ tackling: 16, marking: 16, heading: 15, strength: 15 }) },
  { id: 'fb_ooster',   name: 'Jayden Oosterwolde', position: 'LB', condition: 90, morale: 78, attributes: baseAttrs({ pace: 17, tackling: 15, workRate: 16, crossing: 13 }) },
  { id: 'fb_brown',    name: 'Archie Brown',   position: 'LB', condition: 90, morale: 76, attributes: baseAttrs({ pace: 17, crossing: 15, passing: 14 }) },
  { id: 'fb_semedo',   name: 'Nélson Semedo',  position: 'RB', condition: 90, morale: 78, attributes: baseAttrs({ pace: 16, tackling: 15, workRate: 15 }) },
  { id: 'fb_ismail',   name: 'İsmail Yüksek',  position: 'DM', condition: 90, morale: 78, attributes: baseAttrs({ tackling: 16, marking: 15, passing: 14, workRate: 16 }) },
  { id: 'fb_kante',    name: "N'Golo Kanté",   position: 'DM', condition: 90, morale: 82, attributes: baseAttrs({ tackling: 18, marking: 17, workRate: 18, passing: 14 }) },
  { id: 'fb_guendouzi',name: 'Mattéo Guendouzi', position: 'CM', condition: 90, morale: 82, attributes: baseAttrs({ passing: 16, vision: 16, technique: 15, workRate: 16 }) },
  { id: 'fb_asensio',  name: 'Marco Asensio',  position: 'AM', condition: 90, morale: 84, attributes: baseAttrs({ passing: 17, vision: 17, technique: 17, shooting: 16 }) },
  { id: 'fb_kerem',    name: 'Kerem Aktürkoğlu', position: 'LW', condition: 90, morale: 80, attributes: baseAttrs({ pace: 17, dribbling: 16, shooting: 15, crossing: 15 }) },
  { id: 'fb_nene',     name: 'Dorgeles Nene',  position: 'RW', condition: 90, morale: 78, attributes: baseAttrs({ pace: 16, dribbling: 15, shooting: 14, crossing: 14 }) },
  { id: 'fb_greenwood',name: 'Mason Greenwood', position: 'RW', condition: 90, morale: 82, attributes: baseAttrs({ pace: 16, dribbling: 16, shooting: 16, crossing: 14 }) },
  { id: 'fb_lukaku',   name: 'Romelu Lukaku',  position: 'ST', condition: 90, morale: 82, attributes: baseAttrs({ shooting: 17, heading: 18, positioning: 16, strength: 18 }) },
  { id: 'fb_muriqi',   name: 'Vedat Muriqi',   position: 'ST', condition: 90, morale: 78, attributes: baseAttrs({ shooting: 15, heading: 17, positioning: 15, strength: 17 }) },
];

// ── BJK gerçek kadro ───────────────────────────────────────
const BJK_SQUAD: Player[] = [
  { id: 'bjk_ersin',   name: 'Ersin Destanoğlu', position: 'GK', condition: 90, morale: 78, attributes: baseAttrs({ goalkeeping: 15, reflexes: 15 }) },
  { id: 'bjk_murillo', name: 'Amir Murillo',     position: 'RB', condition: 90, morale: 78, attributes: baseAttrs({ pace: 17, tackling: 14, workRate: 16 }) },
  { id: 'bjk_agbadou', name: 'Emmanuel Agbadou', position: 'CB', condition: 90, morale: 80, attributes: baseAttrs({ tackling: 16, marking: 15, heading: 16, strength: 17 }) },
  { id: 'bjk_uduokhai',name: 'Felix Uduokhai',   position: 'CB', condition: 90, morale: 78, attributes: baseAttrs({ tackling: 15, marking: 15, heading: 15 }) },
  { id: 'bjk_ridvan',  name: 'Rıdvan Yılmaz',    position: 'LB', condition: 90, morale: 76, attributes: baseAttrs({ pace: 16, crossing: 14, workRate: 15 }) },
  { id: 'bjk_ndidi',   name: 'Wilfred Ndidi',    position: 'DM', condition: 90, morale: 82, attributes: baseAttrs({ tackling: 17, marking: 16, workRate: 17 }) },
  { id: 'bjk_orkun',   name: 'Orkun Kökçü',      position: 'CM', condition: 90, morale: 82, attributes: baseAttrs({ passing: 17, vision: 16, technique: 16, shooting: 15 }) },
  { id: 'bjk_cerny',   name: 'Vaclav Cerny',     position: 'AM', condition: 90, morale: 78, attributes: baseAttrs({ passing: 15, vision: 15, technique: 15, shooting: 14 }) },
  { id: 'bjk_olaitan', name: 'Junior Olaitan',   position: 'RW', condition: 90, morale: 76, attributes: baseAttrs({ pace: 16, dribbling: 15, crossing: 13 }) },
  { id: 'bjk_bilal',   name: 'El Bilal Touré',   position: 'ST', condition: 90, morale: 78, attributes: baseAttrs({ shooting: 16, heading: 15, positioning: 15, pace: 15 }) },
  { id: 'bjk_oh',      name: 'Hyeon-gyu Oh',     position: 'ST', condition: 90, morale: 78, attributes: baseAttrs({ shooting: 15, heading: 16, positioning: 15 }) },
  { id: 'bjk_tayyip',  name: 'Tayyip Talha Sanuç', position: 'CB', condition: 90, morale: 74, attributes: baseAttrs({ tackling: 14, marking: 14, heading: 15 }) },
];

// ── TS gerçek kadro ────────────────────────────────────────
const TS_SQUAD: Player[] = [
  { id: 'ts_onana',    name: 'André Onana',      position: 'GK', condition: 90, morale: 82, attributes: baseAttrs({ goalkeeping: 17, reflexes: 16, positioning: 16 }) },
  { id: 'ts_savic',    name: 'Stefan Savić',     position: 'CB', condition: 90, morale: 78, attributes: baseAttrs({ tackling: 16, marking: 16, heading: 15 }) },
  { id: 'ts_nwaiwu',   name: 'Chibuike Nwaiwu',  position: 'CB', condition: 90, morale: 76, attributes: baseAttrs({ tackling: 15, marking: 14, heading: 15 }) },
  { id: 'ts_pina',     name: 'Wagner Pina',      position: 'RB', condition: 90, morale: 76, attributes: baseAttrs({ pace: 16, tackling: 14, workRate: 15 }) },
  { id: 'ts_lovik',    name: 'Mathias Løvik',    position: 'LB', condition: 90, morale: 74, attributes: baseAttrs({ pace: 15, crossing: 14, workRate: 14 }) },
  { id: 'ts_bouchouari',name:'Benjamin Bouchouari', position: 'CM', condition: 90, morale: 78, attributes: baseAttrs({ passing: 16, vision: 15, technique: 15 }) },
  { id: 'ts_muci',     name: 'Ernest Muçi',      position: 'AM', condition: 90, morale: 80, attributes: baseAttrs({ passing: 16, vision: 15, technique: 16, shooting: 15 }) },
  { id: 'ts_zubkov',   name: 'Oleksandr Zubkov', position: 'RW', condition: 90, morale: 78, attributes: baseAttrs({ pace: 16, dribbling: 15, crossing: 14 }) },
  { id: 'ts_nwakaeme', name: 'Anthony Nwakaeme', position: 'LW', condition: 90, morale: 80, attributes: baseAttrs({ pace: 15, dribbling: 16, shooting: 15 }) },
  { id: 'ts_onuachu',  name: 'Paul Onuachu',     position: 'ST', condition: 90, morale: 84, attributes: baseAttrs({ shooting: 17, heading: 18, positioning: 16, strength: 17 }) },
  { id: 'ts_okay',     name: 'Okay Yokuşlu',     position: 'DM', condition: 90, morale: 76, attributes: baseAttrs({ tackling: 15, marking: 15, passing: 13, workRate: 15 }) },
];

// ── Otomatik kadro üretici (diğer 14 takım) ────────────────
function makeSquad(teamId: string, power: number): Player[] {
  const s = (b: number) => Math.max(1, Math.min(20, Math.round(b * (0.6 + power * 0.55))));
  const mk = (id: string, name: string, pos: Position, ov: Partial<PlayerAttributes>) => ({
    id: `${teamId}_${id}`, name, position: pos, condition: 90, morale: 75,
    attributes: baseAttrs({
      passing: s(12), longPassing: s(11), crossing: s(10), shooting: s(10), dribbling: s(11), technique: s(11),
      tackling: s(10), marking: s(10), heading: s(10), vision: s(11), positioning: s(11), decisions: s(11),
      composure: s(11), pace: s(12), stamina: s(13), strength: s(12), agility: s(12), workRate: s(13), aggression: s(12), ...ov,
    }),
  });
  return [
    mk('gk1','Kaleci','GK',{goalkeeping:s(15),reflexes:s(15),positioning:s(14)}),
    mk('rb1','Sağ Bek','RB',{pace:s(15),tackling:s(13),workRate:s(14)}),
    mk('cb1','Stoper 1','CB',{tackling:s(15),marking:s(14),heading:s(14)}),
    mk('cb2','Stoper 2','CB',{tackling:s(14),marking:s(13),heading:s(13)}),
    mk('lb1','Sol Bek','LB',{pace:s(14),tackling:s(13),workRate:s(14)}),
    mk('dm1','Ön Libero','DM',{tackling:s(15),marking:s(14),passing:s(13),workRate:s(15)}),
    mk('dm2','Merkez','DM',{passing:s(14),tackling:s(13),vision:s(13)}),
    mk('rw1','Sağ Açık','RW',{pace:s(15),dribbling:s(15),shooting:s(13)}),
    mk('am1','10 Numara','AM',{passing:s(15),vision:s(15),technique:s(15)}),
    mk('lw1','Sol Açık','LW',{pace:s(15),dribbling:s(14),shooting:s(13)}),
    mk('st1','Santrfor','ST',{shooting:s(16),heading:s(14),positioning:s(15)}),
    mk('gk2','Yedek GK','GK',{goalkeeping:s(12),reflexes:s(12)}),
    mk('cb3','Yedek CB','CB',{tackling:s(13),marking:s(12)}),
    mk('rb2','Yedek RB','RB',{pace:s(13),tackling:s(11)}),
    mk('cm1','Yedek CM','CM',{passing:s(13),vision:s(12)}),
    mk('cm2','Yedek CM','CM',{passing:s(12),vision:s(11)}),
    mk('rw2','Yedek RW','RW',{pace:s(13),dribbling:s(12)}),
    mk('st2','Yedek ST','ST',{shooting:s(13),positioning:s(12)}),
  ];
}

// ── Takımları oluştur ──────────────────────────────────────
const FORMATION: Formation = '4-2-3-1';
const F = (id: string) => [`${id}_gk1`,`${id}_rb1`,`${id}_cb1`,`${id}_cb2`,`${id}_lb1`,`${id}_dm1`,`${id}_dm2`,`${id}_rw1`,`${id}_am1`,`${id}_lw1`,`${id}_st1`];
const B = (id: string) => [`${id}_gk2`,`${id}_cb3`,`${id}_rb2`,`${id}_cm1`,`${id}_cm2`,`${id}_rw2`,`${id}_st2`];

export const TEAMS: Record<string, Team> = {};

// Önce otomatik üret (18 takım tamamı)
for (const [id, p] of Object.entries(TEAM_POWERS)) {
  const squad = makeSquad(id, p.power);
  TEAMS[id] = {
    id, name: id.toUpperCase(), formation: FORMATION,
    tactics: { style: 'wing_play' as TacticStyle, width: 70, depth: 60, pressing: 65, tempo: 60, passingRange: 55 },
    players: squad, startingXI: F(id), bench: B(id),
  };
}

// Gerçek kadroları overwrite et
TEAMS['gs'] = {
  id: 'gs', name: 'Galatasaray', formation: FORMATION,
  tactics: { style: 'wing_play', width: 75, depth: 60, pressing: 70, tempo: 65, passingRange: 55 },
  players: GS_SQUAD,
  startingXI: ['gs_ugurcan','gs_singo','gs_sanchez','gs_bardakci','gs_jakobs','gs_torreira','gs_ilkay','gs_lang','gs_yunus','gs_sane','gs_osimhen'],
  bench: ['gs_gunay','gs_lemia','gs_berkan','gs_sara','gs_baris','gs_icardi'],
};

TEAMS['fb'] = {
  id: 'fb', name: 'Fenerbahçe', formation: FORMATION,
  tactics: { style: 'possession', width: 70, depth: 55, pressing: 65, tempo: 60, passingRange: 65 },
  players: FB_SQUAD,
  startingXI: ['fb_ederson','fb_semedo','fb_skriniar','fb_ake','fb_ooster','fb_kante','fb_guendouzi','fb_greenwood','fb_asensio','fb_kerem','fb_lukaku'],
  bench: ['fb_mertg','fb_ismail','fb_brown','fb_muriqi','fb_nene'],
};

TEAMS['bjk'] = {
  id: 'bjk', name: 'Beşiktaş', formation: FORMATION,
  tactics: { style: 'counter', width: 65, depth: 50, pressing: 60, tempo: 65, passingRange: 55 },
  players: BJK_SQUAD,
  startingXI: ['bjk_ersin','bjk_murillo','bjk_agbadou','bjk_uduokhai','bjk_ridvan','bjk_ndidi','bjk_orkun','bjk_olaitan','bjk_cerny','bjk_bilal','bjk_oh'],
  bench: ['bjk_tayyip'],
};

TEAMS['ts'] = {
  id: 'ts', name: 'Trabzonspor', formation: FORMATION,
  tactics: { style: 'direct', width: 60, depth: 55, pressing: 60, tempo: 60, passingRange: 60 },
  players: TS_SQUAD,
  startingXI: ['ts_onana','ts_pina','ts_savic','ts_nwaiwu','ts_lovik','ts_bouchouari','ts_okay','ts_zubkov','ts_muci','ts_nwakaeme','ts_onuachu'],
  bench: [],
};

// Takım adlarını düzelt (otomatik üretilenler için)
const NAME_MAP: Record<string, string> = {
  gs: 'Galatasaray', fb: 'Fenerbahçe', bjk: 'Beşiktaş', ts: 'Trabzonspor',
  amed: 'Amedspor', cor: 'Çorum FK', riz: 'Çaykur Rizespor', ala: 'Alanyaspor',
  erz: 'Erzurumspor', eyu: 'Eyüpspor', gaz: 'Gaziantep FK', gen: 'Gençlerbirliği',
  goz: 'Göztepe', ibfk: 'Başakşehir', kas: 'Kasımpaşa', koc: 'Kocaelispor',
  sam: 'Samsunspor', kon: 'Konyaspor',
};
for (const id of Object.keys(TEAMS)) {
  if (NAME_MAP[id]) TEAMS[id].name = NAME_MAP[id];
}


// ── 2026-27 sezonu: TFF resmî A takım listelerinden eklenen 14 kadro ──
// Oyuncu adları TFF tescil listelerinden alınmıştır. Mevkiler oyun verisi
// için eşleştirilmiştir; nitelik puanları takım gücüne/mevkiye göre üretilir.
const REGISTERED_SQUADS: Record<string, { name: string; players: { name: string; position: Position }[] }> = {
  "amed": {
    "name": "Amedspor",
    "players": [
      {
        "name": "Alban Lafont",
        "position": "GK"
      },
      {
        "name": "Burak Bozan",
        "position": "GK"
      },
      {
        "name": "Yakup Girişen",
        "position": "GK"
      },
      {
        "name": "Ali Turap Bülbül",
        "position": "RB"
      },
      {
        "name": "Ermal Krasniqi",
        "position": "RB"
      },
      {
        "name": "David Bates",
        "position": "CB"
      },
      {
        "name": "Lumbardh Dellova",
        "position": "CB"
      },
      {
        "name": "Amadou Cissé",
        "position": "CB"
      },
      {
        "name": "Kahraman Demirtaş",
        "position": "CB"
      },
      {
        "name": "Cengiz Umut Meraş",
        "position": "LB"
      },
      {
        "name": "Mehmet Yeşil",
        "position": "CB"
      },
      {
        "name": "Gökhan Gül",
        "position": "DM"
      },
      {
        "name": "Rayan Raveloson",
        "position": "DM"
      },
      {
        "name": "Furkan Soyalp",
        "position": "CM"
      },
      {
        "name": "Dia Saba",
        "position": "AM"
      },
      {
        "name": "Rayan Lutin",
        "position": "AM"
      },
      {
        "name": "Yira Sor",
        "position": "LW"
      },
      {
        "name": "Gift Orban",
        "position": "ST"
      },
      {
        "name": "Mbaye Diagne",
        "position": "ST"
      },
      {
        "name": "Samuel Ballet",
        "position": "RW"
      },
      {
        "name": "Dilhan Demir",
        "position": "RW"
      },
      {
        "name": "Mohamed Khalil",
        "position": "LW"
      },
      {
        "name": "Berk Kızıldemir",
        "position": "RW"
      },
      {
        "name": "Mustafa Burak Bozan",
        "position": "GK"
      },
      {
        "name": "Miraç Acer",
        "position": "CB"
      },
      {
        "name": "Muhammed Hasan Yıldırım",
        "position": "LW"
      }
    ]
  },
  "cor": {
    "name": "Çorum FK",
    "players": [
      {
        "name": "Marcos Felipe",
        "position": "GK"
      },
      {
        "name": "Erhan Erentürk",
        "position": "GK"
      },
      {
        "name": "Arif Şimşir",
        "position": "GK"
      },
      {
        "name": "Gökhan Sazdağı",
        "position": "RB"
      },
      {
        "name": "Alexandre Penetra",
        "position": "CB"
      },
      {
        "name": "Çağlar Söyüncü",
        "position": "CB"
      },
      {
        "name": "Hrvoje Smolčić",
        "position": "CB"
      },
      {
        "name": "Serdar Saatçı",
        "position": "CB"
      },
      {
        "name": "Andrei Borza",
        "position": "LB"
      },
      {
        "name": "Cemali Sertel",
        "position": "LB"
      },
      {
        "name": "Berat Özdemir",
        "position": "DM"
      },
      {
        "name": "Ylber Ramadani",
        "position": "DM"
      },
      {
        "name": "Mohamed Diomandé",
        "position": "CM"
      },
      {
        "name": "Markus Karlsbakk",
        "position": "CM"
      },
      {
        "name": "Ahmed Ildız",
        "position": "CM"
      },
      {
        "name": "Göktan Gürpüz",
        "position": "AM"
      },
      {
        "name": "Ermin Mahmić",
        "position": "AM"
      },
      {
        "name": "Alexandros Kyziridis",
        "position": "LW"
      },
      {
        "name": "Cengiz Ünder",
        "position": "RW"
      },
      {
        "name": "Emircan Gürlük",
        "position": "LW"
      },
      {
        "name": "Jesus Ramirez",
        "position": "ST"
      },
      {
        "name": "Youssoufa Moukoko",
        "position": "ST"
      },
      {
        "name": "Mame Thiam",
        "position": "ST"
      },
      {
        "name": "Hüseyin Bulut",
        "position": "RW"
      },
      {
        "name": "Atakan Akkaynak",
        "position": "CM"
      },
      {
        "name": "Furkan Çetinkaya",
        "position": "AM"
      },
      {
        "name": "Uthman Olayan ju",
        "position": "RW"
      },
      {
        "name": "Alfredo Kulembe Ribeiro",
        "position": "LW"
      }
    ]
  },
  "riz": {
    "name": "Çaykur Rizespor",
    "players": [
      {
        "name": "Yahia Fofana",
        "position": "GK"
      },
      {
        "name": "Zafer Görgen",
        "position": "GK"
      },
      {
        "name": "Efe Doğan",
        "position": "GK"
      },
      {
        "name": "Mithat Pala",
        "position": "RB"
      },
      {
        "name": "Taha Şahin",
        "position": "RB"
      },
      {
        "name": "Attila Mocsi",
        "position": "CB"
      },
      {
        "name": "Siaka Bakayoko",
        "position": "CB"
      },
      {
        "name": "Modibo Sagnan",
        "position": "CB"
      },
      {
        "name": "Khusniddin Alikulov",
        "position": "CB"
      },
      {
        "name": "Zakaria Ariss",
        "position": "LB"
      },
      {
        "name": "Umut Erdem",
        "position": "LB"
      },
      {
        "name": "Tayyip Talha Sanuç",
        "position": "CB"
      },
      {
        "name": "Taylan Antalyalı",
        "position": "DM"
      },
      {
        "name": "Moussa Diakité",
        "position": "DM"
      },
      {
        "name": "Qazim Laçi",
        "position": "CM"
      },
      {
        "name": "Can Bozdoğan",
        "position": "CM"
      },
      {
        "name": "Ibrahim Olawoyin",
        "position": "CM"
      },
      {
        "name": "Dal Varesanović",
        "position": "AM"
      },
      {
        "name": "Valentin Mihăilă",
        "position": "LW"
      },
      {
        "name": "Ahmed Kutucu",
        "position": "LW"
      },
      {
        "name": "Adedire Mebude",
        "position": "RW"
      },
      {
        "name": "Iustin Doicaru",
        "position": "RW"
      },
      {
        "name": "Ali Sowe",
        "position": "ST"
      },
      {
        "name": "Gennaro Borrelli",
        "position": "ST"
      },
      {
        "name": "Emrecan Bulut",
        "position": "LW"
      },
      {
        "name": "Mustafa Coşkun Tosun",
        "position": "ST"
      },
      {
        "name": "Yakup Ayan",
        "position": "CB"
      },
      {
        "name": "Emirhan Yılmaz",
        "position": "CM"
      }
    ]
  },
  "ala": {
    "name": "Alanyaspor",
    "players": [
      {
        "name": "Paulo Victor",
        "position": "GK"
      },
      {
        "name": "Mahmut Can Kara",
        "position": "GK"
      },
      {
        "name": "Mert Furkan Bayram",
        "position": "GK"
      },
      {
        "name": "Florent Hadergjonaj",
        "position": "RB"
      },
      {
        "name": "Nuno Lima",
        "position": "CB"
      },
      {
        "name": "Fatih Aksoy",
        "position": "CB"
      },
      {
        "name": "Fidan Aliti",
        "position": "CB"
      },
      {
        "name": "Bedirhan Özyurt",
        "position": "CB"
      },
      {
        "name": "Yusuf Özdemir",
        "position": "LB"
      },
      {
        "name": "Şahin Dik",
        "position": "LB"
      },
      {
        "name": "Antonio Simao Muanza",
        "position": "DM"
      },
      {
        "name": "Gaius Makouta",
        "position": "DM"
      },
      {
        "name": "Baran Ali Gezek",
        "position": "DM"
      },
      {
        "name": "İzzet Çelik",
        "position": "CM"
      },
      {
        "name": "Emre Demir",
        "position": "AM"
      },
      {
        "name": "Ianis Hagi",
        "position": "AM"
      },
      {
        "name": "Paolo Fernandes",
        "position": "AM"
      },
      {
        "name": "Meschack Elia",
        "position": "LW"
      },
      {
        "name": "Ruan Pereira Duarte",
        "position": "LW"
      },
      {
        "name": "Omar Ben Ali",
        "position": "ST"
      },
      {
        "name": "Arda Usluoğlu",
        "position": "ST"
      },
      {
        "name": "Ivan Cedric",
        "position": "ST"
      },
      {
        "name": "Ui-jo Hwang",
        "position": "ST"
      },
      {
        "name": "Arouna Soro",
        "position": "AM"
      },
      {
        "name": "Enes Keskin",
        "position": "CM"
      },
      {
        "name": "İbrahim Kaya",
        "position": "AM"
      },
      {
        "name": "Bilal Demirağ",
        "position": "RW"
      },
      {
        "name": "Hüseyin Şen",
        "position": "LW"
      }
    ]
  },
  "erz": {
    "name": "Erzurumspor",
    "players": [
      {
        "name": "Mahmut Ertuğrul Taşkıran",
        "position": "GK"
      },
      {
        "name": "Matija Orbanic",
        "position": "GK"
      },
      {
        "name": "Erkan Anapa",
        "position": "GK"
      },
      {
        "name": "Festy Ebosele",
        "position": "RB"
      },
      {
        "name": "Orhan Ovacıklı",
        "position": "RB"
      },
      {
        "name": "Nihad Mujakić",
        "position": "CB"
      },
      {
        "name": "Mustafa Yumlu",
        "position": "CB"
      },
      {
        "name": "Yakup Kırtay",
        "position": "CB"
      },
      {
        "name": "Amar Gerxhaliu",
        "position": "CB"
      },
      {
        "name": "Guram Giorbelidze",
        "position": "LB"
      },
      {
        "name": "Mamadou Ba",
        "position": "DM"
      },
      {
        "name": "Elisha Owusu",
        "position": "DM"
      },
      {
        "name": "Brandon Baiye",
        "position": "CM"
      },
      {
        "name": "Lawrence Agyekum",
        "position": "CM"
      },
      {
        "name": "Miguel Cardoso",
        "position": "AM"
      },
      {
        "name": "Nariman Akhundzada",
        "position": "LW"
      },
      {
        "name": "Gyrano Kerk",
        "position": "RW"
      },
      {
        "name": "Ibrahim Diabaté",
        "position": "ST"
      },
      {
        "name": "Eren Tozlu",
        "position": "ST"
      },
      {
        "name": "Cengizhan Bayrak",
        "position": "RW"
      },
      {
        "name": "Sefa Akgün",
        "position": "CM"
      },
      {
        "name": "Emirhan Acar",
        "position": "CM"
      },
      {
        "name": "Taha İbrahim Rençber",
        "position": "CB"
      },
      {
        "name": "Ömer Arda Kara",
        "position": "CB"
      },
      {
        "name": "Yiğit Baran Karaoğlan",
        "position": "GK"
      },
      {
        "name": "Emre Erdem",
        "position": "CM"
      },
      {
        "name": "Mustafa Fettahoğlu",
        "position": "ST"
      },
      {
        "name": "Martin Rodriguez",
        "position": "LW"
      }
    ]
  },
  "eyu": {
    "name": "Eyüpspor",
    "players": [
      {
        "name": "Horatiu Moldovan",
        "position": "GK"
      },
      {
        "name": "Emre Bilgin",
        "position": "GK"
      },
      {
        "name": "Jawad El Yamiq",
        "position": "CB"
      },
      {
        "name": "Zak Jules",
        "position": "CB"
      },
      {
        "name": "Charles Raux Yao",
        "position": "CB"
      },
      {
        "name": "Seyfettin Anıl Yaşar",
        "position": "CB"
      },
      {
        "name": "Arda Yavuz",
        "position": "RB"
      },
      {
        "name": "Simone Giordano",
        "position": "LB"
      },
      {
        "name": "Abdou Khadre Sy",
        "position": "LB"
      },
      {
        "name": "Chandrel Massanga",
        "position": "DM"
      },
      {
        "name": "Taşkın İlter",
        "position": "DM"
      },
      {
        "name": "Hamza Yiğit Akman",
        "position": "CM"
      },
      {
        "name": "Abdelhamid Sabiri",
        "position": "AM"
      },
      {
        "name": "David Costa",
        "position": "CM"
      },
      {
        "name": "Bilal Boutobba",
        "position": "RW"
      },
      {
        "name": "Konrad Michalak",
        "position": "RW"
      },
      {
        "name": "Lenny Pintor",
        "position": "LW"
      },
      {
        "name": "Yusuf Barası",
        "position": "ST"
      },
      {
        "name": "Ahmed Abdullahi",
        "position": "ST"
      },
      {
        "name": "Musa Eren Karakaş",
        "position": "ST"
      },
      {
        "name": "Talha Ülvan",
        "position": "RW"
      },
      {
        "name": "Mete Kaan Demir",
        "position": "AM"
      },
      {
        "name": "Zak Kennedy Jules",
        "position": "CB"
      },
      {
        "name": "Christ Sadia",
        "position": "LW"
      },
      {
        "name": "Burak Işık",
        "position": "GK"
      },
      {
        "name": "Berhan Kutlay Şatlı",
        "position": "CM"
      },
      {
        "name": "Umut Keseci",
        "position": "LW"
      },
      {
        "name": "Ömer Ahmet Ceyhan",
        "position": "ST"
      }
    ]
  },
  "gaz": {
    "name": "Gaziantep FK",
    "players": [
      {
        "name": "Kacper Tobiasz",
        "position": "GK"
      },
      {
        "name": "Ataberk Dadakdeniz",
        "position": "GK"
      },
      {
        "name": "Arda Kızıldağ",
        "position": "CB"
      },
      {
        "name": "Abakar Sylla",
        "position": "CB"
      },
      {
        "name": "Myenty Abena",
        "position": "CB"
      },
      {
        "name": "Ulrich Meleke",
        "position": "CB"
      },
      {
        "name": "Luis Pérez",
        "position": "RB"
      },
      {
        "name": "Kerim Çalhanoğlu",
        "position": "LB"
      },
      {
        "name": "Nazım Sangaré",
        "position": "RB"
      },
      {
        "name": "Ogün Özçiçek",
        "position": "DM"
      },
      {
        "name": "Juninho Bacuna",
        "position": "CM"
      },
      {
        "name": "Drissa Camara",
        "position": "CM"
      },
      {
        "name": "Karamba Gassama",
        "position": "CM"
      },
      {
        "name": "Kacper Kozlowski",
        "position": "AM"
      },
      {
        "name": "Alexandru Maxim",
        "position": "AM"
      },
      {
        "name": "Victor Gidado",
        "position": "AM"
      },
      {
        "name": "Sontje Hansen",
        "position": "RW"
      },
      {
        "name": "Deian Sorescu",
        "position": "RW"
      },
      {
        "name": "Mirza Cihan",
        "position": "LW"
      },
      {
        "name": "Trivante Stewart",
        "position": "ST"
      },
      {
        "name": "Serdar Dursun",
        "position": "ST"
      },
      {
        "name": "Halil Dervişoğlu",
        "position": "ST"
      },
      {
        "name": "Fuat Bavuk",
        "position": "ST"
      },
      {
        "name": "Sabahattin Destici",
        "position": "RB"
      },
      {
        "name": "Efe Sarıkaya",
        "position": "CB"
      },
      {
        "name": "Ali Osman Kalın",
        "position": "LW"
      },
      {
        "name": "İbrahim Kağan Alkış",
        "position": "GK"
      },
      {
        "name": "Mehmet Samet Kalkan",
        "position": "CM"
      }
    ]
  },
  "gen": {
    "name": "Gençlerbirliği",
    "players": [
      {
        "name": "İrfan Can Eğribayat",
        "position": "GK"
      },
      {
        "name": "Gökhan Akkan",
        "position": "GK"
      },
      {
        "name": "Dimitrios Goutas",
        "position": "CB"
      },
      {
        "name": "Metehan Baltacı",
        "position": "CB"
      },
      {
        "name": "Thalisson",
        "position": "CB"
      },
      {
        "name": "Arda Çağan Çelik",
        "position": "CB"
      },
      {
        "name": "Pedro Pereira",
        "position": "RB"
      },
      {
        "name": "Fıratcan Üzüm",
        "position": "RB"
      },
      {
        "name": "Kevin Rodrigues",
        "position": "LB"
      },
      {
        "name": "Abdurrahim Dursun",
        "position": "LB"
      },
      {
        "name": "Cheikh Niasse",
        "position": "DM"
      },
      {
        "name": "Ousmane Diabate",
        "position": "DM"
      },
      {
        "name": "Rafael Luis",
        "position": "DM"
      },
      {
        "name": "Salih Uçan",
        "position": "CM"
      },
      {
        "name": "Franco Tongya",
        "position": "CM"
      },
      {
        "name": "Oğulcan Ülgün",
        "position": "CM"
      },
      {
        "name": "Tiago Gouveia",
        "position": "RW"
      },
      {
        "name": "Adama Traore",
        "position": "RW"
      },
      {
        "name": "Victor Orakpo",
        "position": "LW"
      },
      {
        "name": "Sekou Koita",
        "position": "ST"
      },
      {
        "name": "Pedro Mendes",
        "position": "ST"
      },
      {
        "name": "Prince Martor",
        "position": "RW"
      },
      {
        "name": "Ensar Çavuşoğlu",
        "position": "CB"
      },
      {
        "name": "Göktuğ Erdem",
        "position": "CM"
      },
      {
        "name": "Furkan Ayaz Özcan",
        "position": "ST"
      },
      {
        "name": "Yiğit Hamza Aydar",
        "position": "LB"
      },
      {
        "name": "Seyfi Toprak Kıskanç",
        "position": "CB"
      },
      {
        "name": "Berk Deniz Çukurcu",
        "position": "CM"
      }
    ]
  },
  "goz": {
    "name": "Göztepe",
    "players": [
      {
        "name": "Luka Gugeshashvili",
        "position": "GK"
      },
      {
        "name": "Arda Özçimen",
        "position": "GK"
      },
      {
        "name": "Allan Godoi",
        "position": "CB"
      },
      {
        "name": "Noah Sonko Sundberg",
        "position": "CB"
      },
      {
        "name": "Taha Altıkardeş",
        "position": "CB"
      },
      {
        "name": "Furkan Bayır",
        "position": "CB"
      },
      {
        "name": "Malcom Bokele",
        "position": "CB"
      },
      {
        "name": "Arda Okan Kurtulan",
        "position": "RB"
      },
      {
        "name": "Ogün Bayrak",
        "position": "RB"
      },
      {
        "name": "Ege Yıldırım",
        "position": "LB"
      },
      {
        "name": "Novatus Miroshi",
        "position": "DM"
      },
      {
        "name": "Rhaldney",
        "position": "DM"
      },
      {
        "name": "Tino Anjorin",
        "position": "CM"
      },
      {
        "name": "Alexis Antunes",
        "position": "AM"
      },
      {
        "name": "Alex Matos",
        "position": "AM"
      },
      {
        "name": "Efkan Bekiroğlu",
        "position": "AM"
      },
      {
        "name": "Richard Akonnor",
        "position": "LW"
      },
      {
        "name": "Ivan Brnic",
        "position": "LW"
      },
      {
        "name": "Juan",
        "position": "ST"
      },
      {
        "name": "Janderson",
        "position": "ST"
      },
      {
        "name": "Sinclair Armstrong",
        "position": "ST"
      },
      {
        "name": "Andre Henrique",
        "position": "ST"
      },
      {
        "name": "Gökdeniz Bayrakdar",
        "position": "RW"
      },
      {
        "name": "Bekir Turaç Böke",
        "position": "ST"
      },
      {
        "name": "Faustino Anjorin",
        "position": "CM"
      },
      {
        "name": "Berke Sarıgül",
        "position": "GK"
      },
      {
        "name": "Boran Eligüzel",
        "position": "CM"
      },
      {
        "name": "Deniz Şeker",
        "position": "ST"
      }
    ]
  },
  "ibfk": {
    "name": "Başakşehir",
    "players": [
      {
        "name": "Muhammed Şengezer",
        "position": "GK"
      },
      {
        "name": "Volkan Babacan",
        "position": "GK"
      },
      {
        "name": "Deniz Dilmen",
        "position": "GK"
      },
      {
        "name": "Jerome Opoku",
        "position": "CB"
      },
      {
        "name": "Emin Bayram",
        "position": "CB"
      },
      {
        "name": "Ousseynou Ba",
        "position": "CB"
      },
      {
        "name": "Hamza Güreler",
        "position": "CB"
      },
      {
        "name": "Christopher Operi",
        "position": "LB"
      },
      {
        "name": "Saba Kharebashvili",
        "position": "LB"
      },
      {
        "name": "Michal Karbownik",
        "position": "RB"
      },
      {
        "name": "Onur Bulut",
        "position": "RB"
      },
      {
        "name": "Jakub Kaluzinski",
        "position": "DM"
      },
      {
        "name": "Onur Ergün",
        "position": "DM"
      },
      {
        "name": "Umut Güneş",
        "position": "CM"
      },
      {
        "name": "Olivier Kemen",
        "position": "CM"
      },
      {
        "name": "Berkay Özcan",
        "position": "CM"
      },
      {
        "name": "Abbosbek Fayzullaev",
        "position": "LW"
      },
      {
        "name": "Ivan Brnic",
        "position": "LW"
      },
      {
        "name": "Yusuf Sarı",
        "position": "RW"
      },
      {
        "name": "Andreas Skov Olsen",
        "position": "RW"
      },
      {
        "name": "Edin Visca",
        "position": "RW"
      },
      {
        "name": "Eldor Shomurodov",
        "position": "ST"
      },
      {
        "name": "Bertuğ Yıldırım",
        "position": "ST"
      },
      {
        "name": "Davie Selke",
        "position": "ST"
      },
      {
        "name": "Umut Bozok",
        "position": "ST"
      },
      {
        "name": "Albert Ajua Gomez",
        "position": "ST"
      },
      {
        "name": "Ömer Ali Şahiner",
        "position": "RB"
      },
      {
        "name": "Güven Atalay",
        "position": "CM"
      }
    ]
  },
  "kas": {
    "name": "Kasımpaşa",
    "players": [
      {
        "name": "Andreas Gianniotis",
        "position": "GK"
      },
      {
        "name": "Ali Emre Yanar",
        "position": "GK"
      },
      {
        "name": "Ege Albayrak",
        "position": "GK"
      },
      {
        "name": "Matei Ilie",
        "position": "CB"
      },
      {
        "name": "Kevin Mouanga",
        "position": "CB"
      },
      {
        "name": "Adam Arous",
        "position": "CB"
      },
      {
        "name": "Adem Arous",
        "position": "CB"
      },
      {
        "name": "Ayberk Karapo",
        "position": "RB"
      },
      {
        "name": "Claudio Winck",
        "position": "RB"
      },
      {
        "name": "Jakob Jessen",
        "position": "LB"
      },
      {
        "name": "Ömer Bayram",
        "position": "LB"
      },
      {
        "name": "Elson Mendes",
        "position": "DM"
      },
      {
        "name": "Andri Baldursson",
        "position": "DM"
      },
      {
        "name": "Atakan Müjde",
        "position": "DM"
      },
      {
        "name": "Kerem Demirbay",
        "position": "CM"
      },
      {
        "name": "Haris Hajradinovic",
        "position": "AM"
      },
      {
        "name": "Jesurun Rak-Sakyi",
        "position": "RW"
      },
      {
        "name": "Marcus Rafferty",
        "position": "LW"
      },
      {
        "name": "Thiemoko Diarra",
        "position": "LW"
      },
      {
        "name": "Ali Yavuz Kol",
        "position": "LW"
      },
      {
        "name": "Güven Yalçın",
        "position": "ST"
      },
      {
        "name": "Adrian Benedyczak",
        "position": "ST"
      },
      {
        "name": "Muhammed Emin Bektaş",
        "position": "ST"
      },
      {
        "name": "Sercan Deniz",
        "position": "LW"
      },
      {
        "name": "Sinan Alkaş",
        "position": "ST"
      },
      {
        "name": "Emirhan Boz",
        "position": "DM"
      },
      {
        "name": "Emirhan Yiğit",
        "position": "RW"
      },
      {
        "name": "Ahmet Taha Dağbaşı",
        "position": "CB"
      }
    ]
  },
  "koc": {
    "name": "Kocaelispor",
    "players": [
      {
        "name": "Aleksandar Jovanovic",
        "position": "GK"
      },
      {
        "name": "Onurcan Piri",
        "position": "GK"
      },
      {
        "name": "Serhat Öztaşdelen",
        "position": "GK"
      },
      {
        "name": "Tanguy Zoukrou",
        "position": "CB"
      },
      {
        "name": "Matej Maglica",
        "position": "CB"
      },
      {
        "name": "Emir Ortakaya",
        "position": "CB"
      },
      {
        "name": "Bedirhan Yıldız",
        "position": "CB"
      },
      {
        "name": "Muharrem Cinan",
        "position": "LB"
      },
      {
        "name": "Massadio Haidara",
        "position": "LB"
      },
      {
        "name": "Anfernee Dijksteel",
        "position": "RB"
      },
      {
        "name": "Uğur Kaan Yıldız",
        "position": "RB"
      },
      {
        "name": "Berkan Kutlu",
        "position": "CM"
      },
      {
        "name": "Makana Baku",
        "position": "LW"
      },
      {
        "name": "Manuel Cafumana",
        "position": "DM"
      },
      {
        "name": "Mahamadou Susoho",
        "position": "CM"
      },
      {
        "name": "Tobias Gulliksen",
        "position": "RW"
      },
      {
        "name": "Gonçalo Sousa",
        "position": "RW"
      },
      {
        "name": "Daniel Agyei",
        "position": "ST"
      },
      {
        "name": "Bruno Petkovic",
        "position": "ST"
      },
      {
        "name": "Florian Aye",
        "position": "ST"
      },
      {
        "name": "Rigoberto Rivas",
        "position": "LW"
      },
      {
        "name": "Tayfur Bingöl",
        "position": "RW"
      },
      {
        "name": "Metehan Altunbaş",
        "position": "ST"
      },
      {
        "name": "Haydar Karataş",
        "position": "RW"
      },
      {
        "name": "Hulusi Destici",
        "position": "ST"
      },
      {
        "name": "Arda Özyar",
        "position": "CM"
      },
      {
        "name": "Onur Öztonga",
        "position": "CB"
      },
      {
        "name": "Bedirhan Yıldız",
        "position": "CB"
      }
    ]
  },
  "sam": {
    "name": "Samsunspor",
    "players": [
      {
        "name": "Okan Kocuk",
        "position": "GK"
      },
      {
        "name": "Bilal Bayazıt",
        "position": "GK"
      },
      {
        "name": "Efe Yiğit Üstün",
        "position": "GK"
      },
      {
        "name": "Gabriele Guarino",
        "position": "CB"
      },
      {
        "name": "Igor Drapiński",
        "position": "CB"
      },
      {
        "name": "Strahinja Eraković",
        "position": "CB"
      },
      {
        "name": "Yunus Emre Çift",
        "position": "CB"
      },
      {
        "name": "Josafat Mendes",
        "position": "RB"
      },
      {
        "name": "Joe Mendes",
        "position": "RB"
      },
      {
        "name": "Logi Tómasson",
        "position": "LB"
      },
      {
        "name": "Enes Albak",
        "position": "LB"
      },
      {
        "name": "Elliot Watt",
        "position": "DM"
      },
      {
        "name": "Celil Yüksel",
        "position": "CM"
      },
      {
        "name": "Yalçın Kayan",
        "position": "CM"
      },
      {
        "name": "Antoine Sekongo",
        "position": "CM"
      },
      {
        "name": "Oskar Øhlenschlæger",
        "position": "CM"
      },
      {
        "name": "Afonso Sousa",
        "position": "AM"
      },
      {
        "name": "Samed Onur",
        "position": "CM"
      },
      {
        "name": "Tanguy Coulibaly",
        "position": "RW"
      },
      {
        "name": "Elayis Tavsan",
        "position": "RW"
      },
      {
        "name": "Saikuba Jarju",
        "position": "RW"
      },
      {
        "name": "Jaurès Assoumou",
        "position": "LW"
      },
      {
        "name": "Emre Kılınç",
        "position": "LW"
      },
      {
        "name": "Fatih Kaya",
        "position": "ST"
      },
      {
        "name": "Mohamed Bayo",
        "position": "ST"
      },
      {
        "name": "Muhammet Talha Akyüz",
        "position": "ST"
      },
      {
        "name": "Bedirhan Çetin",
        "position": "CB"
      }
    ]
  },
  "kon": {
    "name": "Konyaspor",
    "players": [
      {
        "name": "Deniz Ertaş",
        "position": "GK"
      },
      {
        "name": "Bahadır Güngördü",
        "position": "GK"
      },
      {
        "name": "Alpha Kabinet Fofana",
        "position": "GK"
      },
      {
        "name": "Adil Demirbağ",
        "position": "CB"
      },
      {
        "name": "Chidozie Awaziem",
        "position": "CB"
      },
      {
        "name": "Rayyan Baniya",
        "position": "CB"
      },
      {
        "name": "Uğurcan Yazğılı",
        "position": "CB"
      },
      {
        "name": "Arif Boşluk",
        "position": "LB"
      },
      {
        "name": "Arthur Masuaku",
        "position": "LB"
      },
      {
        "name": "Ahmet Oğuz",
        "position": "RB"
      },
      {
        "name": "Yhoan Andzouana",
        "position": "RB"
      },
      {
        "name": "Marko Jevtovic",
        "position": "DM"
      },
      {
        "name": "Rajmund Toth",
        "position": "DM"
      },
      {
        "name": "Mücahit İbrahimoglu",
        "position": "DM"
      },
      {
        "name": "Diogo Gonçalves",
        "position": "AM"
      },
      {
        "name": "Enis Bardhi",
        "position": "AM"
      },
      {
        "name": "Melih İbrahimoglu",
        "position": "CM"
      },
      {
        "name": "Ebrima Colley",
        "position": "LW"
      },
      {
        "name": "Jean-Luc Dompé",
        "position": "LW"
      },
      {
        "name": "Emir Bars",
        "position": "LW"
      },
      {
        "name": "Deniz Türüç",
        "position": "RW"
      },
      {
        "name": "Jackson Muleka",
        "position": "ST"
      },
      {
        "name": "Mostafa Mohamed",
        "position": "ST"
      },
      {
        "name": "Enis Destan",
        "position": "ST"
      },
      {
        "name": "Joao Pedro Da Mata",
        "position": "CB"
      },
      {
        "name": "Egemen Aydın",
        "position": "GK"
      },
      {
        "name": "Ata Yanık",
        "position": "CB"
      },
      {
        "name": "Ömer Çobanoğlu",
        "position": "DM"
      }
    ]
  }
};

function makeRegisteredSquad(teamId: string, roster: { name: string; position: Position }[], power: number): Player[] {
  const scale = (value: number) => Math.max(1, Math.min(20, Math.round(value * (0.6 + power * 0.55))));
  return roster.map((entry, index) => {
    const pos = entry.position;
    const attrs: Partial<PlayerAttributes> = {};
    if (pos === 'GK') Object.assign(attrs, { goalkeeping: scale(15), reflexes: scale(15), positioning: scale(14), decisions: scale(13) });
    else if (pos === 'CB') Object.assign(attrs, { tackling: scale(15), marking: scale(15), heading: scale(14), strength: scale(14), positioning: scale(14) });
    else if (pos === 'LB' || pos === 'RB') Object.assign(attrs, { pace: scale(15), tackling: scale(13), crossing: scale(13), stamina: scale(14), workRate: scale(14) });
    else if (pos === 'DM') Object.assign(attrs, { tackling: scale(14), marking: scale(13), passing: scale(13), stamina: scale(14), workRate: scale(15) });
    else if (pos === 'CM') Object.assign(attrs, { passing: scale(14), vision: scale(13), technique: scale(13), stamina: scale(14), decisions: scale(13) });
    else if (pos === 'AM') Object.assign(attrs, { passing: scale(14), vision: scale(15), technique: scale(15), dribbling: scale(14), shooting: scale(13) });
    else if (pos === 'LW' || pos === 'RW') Object.assign(attrs, { pace: scale(15), dribbling: scale(15), crossing: scale(13), shooting: scale(13), technique: scale(14) });
    else Object.assign(attrs, { shooting: scale(15), heading: scale(14), positioning: scale(15), strength: scale(14) });

    const attributes = baseAttrs(attrs);
    // Aynı mevki şablonundaki oyuncuların kopya istatistiklere sahip olmasını
    // önle: isim + takım + özellik anahtarı üzerinden sabit, tekrarlanabilir
    // küçük farklar üret. Rastgele sayı kullanılmaz.
    const playerKey = `${teamId}:${index}:${entry.name}`;
    for (const key of Object.keys(attributes) as (keyof PlayerAttributes)[]) {
      if (pos !== 'GK' && (key === 'goalkeeping' || key === 'reflexes')) continue;
      let hash = 0;
      const source = `${playerKey}:${key}`;
      for (let i = 0; i < source.length; i++) {
        hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
      }
      const variation = (hash % 5) - 2;
      attributes[key] = Math.max(1, Math.min(20, attributes[key] + variation));
    }

    return {
      id: `${teamId}_real_${index + 1}`,
      name: entry.name,
      position: pos,
      condition: 90,
      morale: 75,
      attributes,
    };
  });
}

function buildRegisteredTeam(id: string, entry: { name: string; players: { name: string; position: Position }[] }): Team {
  const power = (TEAM_POWERS as Record<string, { power: number }>)[id]?.power ?? 0.5;
  const players = makeRegisteredSquad(id, entry.players, power);
  const pick = (positions: Position[], used: Set<string>) => {
    const player = players.find(p => positions.includes(p.position) && !used.has(p.id));
    if (player) used.add(player.id);
    return player?.id;
  };
  const used = new Set<string>();
  const startingXI = [
    pick(['GK'], used), pick(['RB'], used), pick(['CB'], used), pick(['CB'], used),
    pick(['LB'], used), pick(['DM'], used), pick(['CM','DM'], used),
    pick(['RW'], used), pick(['AM','CM'], used), pick(['LW'], used), pick(['ST'], used),
  ].filter((id): id is string => Boolean(id));
  for (const player of players) {
    if (startingXI.length >= 11) break;
    if (!used.has(player.id)) {
      used.add(player.id);
      startingXI.push(player.id);
    }
  }
  const bench = players.filter(p => !used.has(p.id)).slice(0, 7).map(p => p.id);
  return {
    id, name: entry.name, formation: FORMATION,
    tactics: { style: 'wing_play' as TacticStyle, width: 65, depth: 55, pressing: 60, tempo: 60, passingRange: 55 },
    players, startingXI, bench,
  };
}

// Eski sezonun bu üç kulübü 2026-27 Süper Lig listesinde bulunmuyor.
delete TEAMS['kay'];
delete TEAMS['ant'];
delete TEAMS['kar'];

// Kalan 14 kulübün jenerik oyuncuları gerçek oyuncu adlarıyla değiştirilir.
for (const [id, entry] of Object.entries(REGISTERED_SQUADS)) {
  TEAMS[id] = buildRegisteredTeam(id, entry);
}
