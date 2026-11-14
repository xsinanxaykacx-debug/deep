"use strict";
(() => {
  // teamPower.ts
  var RAW = {
    gs: { last: 95, current: 77, value: 337 },
    fb: { last: 84, current: 74, value: 241 },
    bjk: { last: 62, current: 60, value: 176 },
    ts: { last: 51, current: 69, value: 130 },
    ibfk: { last: 54, current: 57, value: 85 },
    goz: { last: 50, current: 55, value: 66 },
    sam: { last: 64, current: 51, value: 56 },
    riz: { last: 49, current: 41, value: 40 },
    kon: { last: 46, current: 40, value: 39 },
    ala: { last: 45, current: 37, value: 34 },
    gaz: { last: 45, current: 37, value: 35 },
    kas: { last: 47, current: 35, value: 31 },
    kay: { last: 45, current: 30, value: 25 },
    ant: { last: 44, current: 32, value: 19 },
    eyu: { last: 53, current: 33, value: 17 },
    koc: { last: 0, current: 37, value: 30 },
    gen: { last: 0, current: 34, value: 28 },
    kar: { last: 0, current: 30, value: 22 }
  };
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function computePower(last, current, value) {
    for (const [label, input] of [
      ["last", last],
      ["current", current],
      ["value", value]
    ]) {
      if (!Number.isFinite(input) || input < 0) {
        throw new Error(`${label} negatif olmayan sonlu say\u0131 olmal\u0131: ${input}`);
      }
    }
    let pointsPower;
    if (last > 0) {
      const lastPerMatch = last / 36;
      const currentPerMatch = current / 34;
      pointsPower = (lastPerMatch * 0.5 + currentPerMatch * 0.5) / 2.8;
    } else {
      pointsPower = current / 34 / 2.8 * 0.9;
    }
    const valuePower = clamp(value / 337, 0, 1);
    return clamp(pointsPower * 0.85 + valuePower * 0.15, 0, 1);
  }
  function buildTeamPower(id, data) {
    const power = computePower(data.last, data.current, data.value);
    return {
      id,
      name: id.toUpperCase(),
      power: Math.round(power * 1e3) / 1e3,
      attackStrength: Math.round(power * 100) / 100,
      defenseStrength: Math.round((power * 0.9 + 0.1) * 100) / 100,
      lastSeasonPts: data.last,
      currentPts: data.current,
      squadValue: data.value
    };
  }
  var TEAM_POWERS = {};
  for (const [id, data] of Object.entries(RAW)) {
    TEAM_POWERS[id] = buildTeamPower(id, data);
  }

  // squads.ts
  function baseAttrs(o = {}) {
    return {
      passing: 12,
      longPassing: 12,
      crossing: 10,
      shooting: 10,
      dribbling: 12,
      technique: 12,
      tackling: 10,
      marking: 10,
      heading: 10,
      vision: 12,
      positioning: 12,
      decisions: 12,
      composure: 12,
      pace: 12,
      stamina: 13,
      strength: 12,
      agility: 12,
      workRate: 13,
      aggression: 12,
      goalkeeping: 1,
      reflexes: 1,
      ...o
    };
  }
  var GS_SQUAD = [
    { id: "gs_ugurcan", name: "U\u011Furcan \xC7ak\u0131r", position: "GK", condition: 90, morale: 82, attributes: baseAttrs({ goalkeeping: 17, reflexes: 16, positioning: 16 }) },
    { id: "gs_gunay", name: "G\xFCnay G\xFCven\xE7", position: "GK", condition: 90, morale: 70, attributes: baseAttrs({ goalkeeping: 14, reflexes: 14 }) },
    { id: "gs_sanchez", name: "Davinson S\xE1nchez", position: "CB", condition: 90, morale: 82, attributes: baseAttrs({ tackling: 17, marking: 16, heading: 16, strength: 17, pace: 15 }) },
    { id: "gs_bardakci", name: "Abd\xFClkerim Bardakc\u0131", position: "CB", condition: 90, morale: 78, attributes: baseAttrs({ tackling: 15, marking: 15, heading: 15, passing: 14 }) },
    { id: "gs_jakobs", name: "Ismail Jakobs", position: "LB", condition: 90, morale: 77, attributes: baseAttrs({ pace: 16, crossing: 15, passing: 14, workRate: 15 }) },
    { id: "gs_singo", name: "Wilfried Singo", position: "RB", condition: 90, morale: 78, attributes: baseAttrs({ pace: 17, tackling: 15, workRate: 16, crossing: 13 }) },
    { id: "gs_torreira", name: "Lucas Torreira", position: "DM", condition: 90, morale: 84, attributes: baseAttrs({ tackling: 17, marking: 16, passing: 15, vision: 14, workRate: 18, aggression: 16 }) },
    { id: "gs_ilkay", name: "\u0130lkay G\xFCndo\u011Fan", position: "CM", condition: 90, morale: 84, attributes: baseAttrs({ passing: 18, vision: 17, technique: 17, decisions: 17, composure: 17, shooting: 14 }) },
    { id: "gs_sara", name: "Gabriel Sara", position: "CM", condition: 90, morale: 80, attributes: baseAttrs({ passing: 16, vision: 16, technique: 16, shooting: 14 }) },
    { id: "gs_lang", name: "Noa Lang", position: "RW", condition: 90, morale: 80, attributes: baseAttrs({ pace: 17, dribbling: 16, shooting: 14, crossing: 14, technique: 15 }) },
    { id: "gs_sane", name: "Leroy San\xE9", position: "LW", condition: 90, morale: 82, attributes: baseAttrs({ pace: 18, dribbling: 17, shooting: 15, crossing: 15, technique: 17 }) },
    { id: "gs_osimhen", name: "Victor Osimhen", position: "ST", condition: 90, morale: 88, attributes: baseAttrs({ shooting: 18, heading: 17, positioning: 18, composure: 17, strength: 17, pace: 17 }) },
    { id: "gs_yunus", name: "Yunus Akg\xFCn", position: "AM", condition: 90, morale: 78, attributes: baseAttrs({ passing: 15, vision: 15, technique: 16, dribbling: 15, shooting: 13 }) },
    { id: "gs_icardi", name: "Mauro Icardi", position: "ST", condition: 90, morale: 84, attributes: baseAttrs({ shooting: 18, heading: 16, positioning: 18, composure: 17 }) },
    { id: "gs_baris", name: "Bar\u0131\u015F Alper Y\u0131lmaz", position: "RW", condition: 90, morale: 78, attributes: baseAttrs({ pace: 18, workRate: 16, dribbling: 14, crossing: 13 }) },
    { id: "gs_lemia", name: "Mario Lemina", position: "DM", condition: 90, morale: 76, attributes: baseAttrs({ tackling: 15, marking: 14, passing: 13, workRate: 15 }) },
    { id: "gs_berkan", name: "Berkan Kutlu", position: "CM", condition: 90, morale: 74, attributes: baseAttrs({ passing: 13, stamina: 16, workRate: 15 }) }
  ];
  var FB_SQUAD = [
    { id: "fb_ederson", name: "Ederson", position: "GK", condition: 90, morale: 84, attributes: baseAttrs({ goalkeeping: 18, reflexes: 17, positioning: 17 }) },
    { id: "fb_mertg", name: "Mert G\xFCnok", position: "GK", condition: 90, morale: 70, attributes: baseAttrs({ goalkeeping: 14, reflexes: 14 }) },
    { id: "fb_skriniar", name: "Milan \u0160kriniar", position: "CB", condition: 90, morale: 82, attributes: baseAttrs({ tackling: 17, marking: 17, heading: 17, strength: 17 }) },
    { id: "fb_ake", name: "Nathan Ak\xE9", position: "CB", condition: 90, morale: 80, attributes: baseAttrs({ tackling: 16, marking: 16, heading: 15, strength: 15 }) },
    { id: "fb_ooster", name: "Jayden Oosterwolde", position: "LB", condition: 90, morale: 78, attributes: baseAttrs({ pace: 17, tackling: 15, workRate: 16, crossing: 13 }) },
    { id: "fb_brown", name: "Archie Brown", position: "LB", condition: 90, morale: 76, attributes: baseAttrs({ pace: 17, crossing: 15, passing: 14 }) },
    { id: "fb_semedo", name: "N\xE9lson Semedo", position: "RB", condition: 90, morale: 78, attributes: baseAttrs({ pace: 16, tackling: 15, workRate: 15 }) },
    { id: "fb_ismail", name: "\u0130smail Y\xFCksek", position: "DM", condition: 90, morale: 78, attributes: baseAttrs({ tackling: 16, marking: 15, passing: 14, workRate: 16 }) },
    { id: "fb_kante", name: "N'Golo Kant\xE9", position: "DM", condition: 90, morale: 82, attributes: baseAttrs({ tackling: 18, marking: 17, workRate: 18, passing: 14 }) },
    { id: "fb_guendouzi", name: "Matt\xE9o Guendouzi", position: "CM", condition: 90, morale: 82, attributes: baseAttrs({ passing: 16, vision: 16, technique: 15, workRate: 16 }) },
    { id: "fb_asensio", name: "Marco Asensio", position: "AM", condition: 90, morale: 84, attributes: baseAttrs({ passing: 17, vision: 17, technique: 17, shooting: 16 }) },
    { id: "fb_kerem", name: "Kerem Akt\xFCrko\u011Flu", position: "LW", condition: 90, morale: 80, attributes: baseAttrs({ pace: 17, dribbling: 16, shooting: 15, crossing: 15 }) },
    { id: "fb_nene", name: "Dorgeles Nene", position: "RW", condition: 90, morale: 78, attributes: baseAttrs({ pace: 16, dribbling: 15, shooting: 14, crossing: 14 }) },
    { id: "fb_greenwood", name: "Mason Greenwood", position: "RW", condition: 90, morale: 82, attributes: baseAttrs({ pace: 16, dribbling: 16, shooting: 16, crossing: 14 }) },
    { id: "fb_lukaku", name: "Romelu Lukaku", position: "ST", condition: 90, morale: 82, attributes: baseAttrs({ shooting: 17, heading: 18, positioning: 16, strength: 18 }) },
    { id: "fb_muriqi", name: "Vedat Muriqi", position: "ST", condition: 90, morale: 78, attributes: baseAttrs({ shooting: 15, heading: 17, positioning: 15, strength: 17 }) }
  ];
  var BJK_SQUAD = [
    { id: "bjk_ersin", name: "Ersin Destano\u011Flu", position: "GK", condition: 90, morale: 78, attributes: baseAttrs({ goalkeeping: 15, reflexes: 15 }) },
    { id: "bjk_murillo", name: "Amir Murillo", position: "RB", condition: 90, morale: 78, attributes: baseAttrs({ pace: 17, tackling: 14, workRate: 16 }) },
    { id: "bjk_agbadou", name: "Emmanuel Agbadou", position: "CB", condition: 90, morale: 80, attributes: baseAttrs({ tackling: 16, marking: 15, heading: 16, strength: 17 }) },
    { id: "bjk_uduokhai", name: "Felix Uduokhai", position: "CB", condition: 90, morale: 78, attributes: baseAttrs({ tackling: 15, marking: 15, heading: 15 }) },
    { id: "bjk_ridvan", name: "R\u0131dvan Y\u0131lmaz", position: "LB", condition: 90, morale: 76, attributes: baseAttrs({ pace: 16, crossing: 14, workRate: 15 }) },
    { id: "bjk_ndidi", name: "Wilfred Ndidi", position: "DM", condition: 90, morale: 82, attributes: baseAttrs({ tackling: 17, marking: 16, workRate: 17 }) },
    { id: "bjk_orkun", name: "Orkun K\xF6k\xE7\xFC", position: "CM", condition: 90, morale: 82, attributes: baseAttrs({ passing: 17, vision: 16, technique: 16, shooting: 15 }) },
    { id: "bjk_cerny", name: "Vaclav Cerny", position: "AM", condition: 90, morale: 78, attributes: baseAttrs({ passing: 15, vision: 15, technique: 15, shooting: 14 }) },
    { id: "bjk_olaitan", name: "Junior Olaitan", position: "RW", condition: 90, morale: 76, attributes: baseAttrs({ pace: 16, dribbling: 15, crossing: 13 }) },
    { id: "bjk_bilal", name: "El Bilal Tour\xE9", position: "ST", condition: 90, morale: 78, attributes: baseAttrs({ shooting: 16, heading: 15, positioning: 15, pace: 15 }) },
    { id: "bjk_oh", name: "Hyeon-gyu Oh", position: "ST", condition: 90, morale: 78, attributes: baseAttrs({ shooting: 15, heading: 16, positioning: 15 }) },
    { id: "bjk_tayyip", name: "Tayyip Talha Sanu\xE7", position: "CB", condition: 90, morale: 74, attributes: baseAttrs({ tackling: 14, marking: 14, heading: 15 }) }
  ];
  var TS_SQUAD = [
    { id: "ts_onana", name: "Andr\xE9 Onana", position: "GK", condition: 90, morale: 82, attributes: baseAttrs({ goalkeeping: 17, reflexes: 16, positioning: 16 }) },
    { id: "ts_savic", name: "Stefan Savi\u0107", position: "CB", condition: 90, morale: 78, attributes: baseAttrs({ tackling: 16, marking: 16, heading: 15 }) },
    { id: "ts_nwaiwu", name: "Chibuike Nwaiwu", position: "CB", condition: 90, morale: 76, attributes: baseAttrs({ tackling: 15, marking: 14, heading: 15 }) },
    { id: "ts_pina", name: "Wagner Pina", position: "RB", condition: 90, morale: 76, attributes: baseAttrs({ pace: 16, tackling: 14, workRate: 15 }) },
    { id: "ts_lovik", name: "Mathias L\xF8vik", position: "LB", condition: 90, morale: 74, attributes: baseAttrs({ pace: 15, crossing: 14, workRate: 14 }) },
    { id: "ts_bouchouari", name: "Benjamin Bouchouari", position: "CM", condition: 90, morale: 78, attributes: baseAttrs({ passing: 16, vision: 15, technique: 15 }) },
    { id: "ts_muci", name: "Ernest Mu\xE7i", position: "AM", condition: 90, morale: 80, attributes: baseAttrs({ passing: 16, vision: 15, technique: 16, shooting: 15 }) },
    { id: "ts_zubkov", name: "Oleksandr Zubkov", position: "RW", condition: 90, morale: 78, attributes: baseAttrs({ pace: 16, dribbling: 15, crossing: 14 }) },
    { id: "ts_nwakaeme", name: "Anthony Nwakaeme", position: "LW", condition: 90, morale: 80, attributes: baseAttrs({ pace: 15, dribbling: 16, shooting: 15 }) },
    { id: "ts_onuachu", name: "Paul Onuachu", position: "ST", condition: 90, morale: 84, attributes: baseAttrs({ shooting: 17, heading: 18, positioning: 16, strength: 17 }) },
    { id: "ts_okay", name: "Okay Yoku\u015Flu", position: "DM", condition: 90, morale: 76, attributes: baseAttrs({ tackling: 15, marking: 15, passing: 13, workRate: 15 }) }
  ];
  function makeSquad(teamId, power) {
    const s = (b) => Math.max(1, Math.min(20, Math.round(b * (0.6 + power * 0.55))));
    const mk = (id, name, pos, ov) => ({
      id: `${teamId}_${id}`,
      name,
      position: pos,
      condition: 90,
      morale: 75,
      attributes: baseAttrs({
        passing: s(12),
        longPassing: s(11),
        crossing: s(10),
        shooting: s(10),
        dribbling: s(11),
        technique: s(11),
        tackling: s(10),
        marking: s(10),
        heading: s(10),
        vision: s(11),
        positioning: s(11),
        decisions: s(11),
        composure: s(11),
        pace: s(12),
        stamina: s(13),
        strength: s(12),
        agility: s(12),
        workRate: s(13),
        aggression: s(12),
        ...ov
      })
    });
    return [
      mk("gk1", "Kaleci", "GK", { goalkeeping: s(15), reflexes: s(15), positioning: s(14) }),
      mk("rb1", "Sa\u011F Bek", "RB", { pace: s(15), tackling: s(13), workRate: s(14) }),
      mk("cb1", "Stoper 1", "CB", { tackling: s(15), marking: s(14), heading: s(14) }),
      mk("cb2", "Stoper 2", "CB", { tackling: s(14), marking: s(13), heading: s(13) }),
      mk("lb1", "Sol Bek", "LB", { pace: s(14), tackling: s(13), workRate: s(14) }),
      mk("dm1", "\xD6n Libero", "DM", { tackling: s(15), marking: s(14), passing: s(13), workRate: s(15) }),
      mk("dm2", "Merkez", "DM", { passing: s(14), tackling: s(13), vision: s(13) }),
      mk("rw1", "Sa\u011F A\xE7\u0131k", "RW", { pace: s(15), dribbling: s(15), shooting: s(13) }),
      mk("am1", "10 Numara", "AM", { passing: s(15), vision: s(15), technique: s(15) }),
      mk("lw1", "Sol A\xE7\u0131k", "LW", { pace: s(15), dribbling: s(14), shooting: s(13) }),
      mk("st1", "Santrfor", "ST", { shooting: s(16), heading: s(14), positioning: s(15) }),
      mk("gk2", "Yedek GK", "GK", { goalkeeping: s(12), reflexes: s(12) }),
      mk("cb3", "Yedek CB", "CB", { tackling: s(13), marking: s(12) }),
      mk("rb2", "Yedek RB", "RB", { pace: s(13), tackling: s(11) }),
      mk("cm1", "Yedek CM", "CM", { passing: s(13), vision: s(12) }),
      mk("cm2", "Yedek CM", "CM", { passing: s(12), vision: s(11) }),
      mk("rw2", "Yedek RW", "RW", { pace: s(13), dribbling: s(12) }),
      mk("st2", "Yedek ST", "ST", { shooting: s(13), positioning: s(12) })
    ];
  }
  var FORMATION = "4-2-3-1";
  var F = (id) => [`${id}_gk1`, `${id}_rb1`, `${id}_cb1`, `${id}_cb2`, `${id}_lb1`, `${id}_dm1`, `${id}_dm2`, `${id}_rw1`, `${id}_am1`, `${id}_lw1`, `${id}_st1`];
  var B = (id) => [`${id}_gk2`, `${id}_cb3`, `${id}_rb2`, `${id}_cm1`, `${id}_cm2`, `${id}_rw2`, `${id}_st2`];
  var TEAMS = {};
  for (const [id, p] of Object.entries(TEAM_POWERS)) {
    const squad = makeSquad(id, p.power);
    TEAMS[id] = {
      id,
      name: id.toUpperCase(),
      formation: FORMATION,
      tactics: { style: "wing_play", width: 70, depth: 60, pressing: 65, tempo: 60, passingRange: 55 },
      players: squad,
      startingXI: F(id),
      bench: B(id)
    };
  }
  TEAMS["gs"] = {
    id: "gs",
    name: "Galatasaray",
    formation: FORMATION,
    tactics: { style: "wing_play", width: 75, depth: 60, pressing: 70, tempo: 65, passingRange: 55 },
    players: GS_SQUAD,
    startingXI: ["gs_ugurcan", "gs_singo", "gs_sanchez", "gs_bardakci", "gs_jakobs", "gs_torreira", "gs_ilkay", "gs_lang", "gs_yunus", "gs_sane", "gs_osimhen"],
    bench: ["gs_gunay", "gs_lemia", "gs_berkan", "gs_sara", "gs_baris", "gs_icardi"]
  };
  TEAMS["fb"] = {
    id: "fb",
    name: "Fenerbah\xE7e",
    formation: FORMATION,
    tactics: { style: "possession", width: 70, depth: 55, pressing: 65, tempo: 60, passingRange: 65 },
    players: FB_SQUAD,
    startingXI: ["fb_ederson", "fb_semedo", "fb_skriniar", "fb_ake", "fb_ooster", "fb_kante", "fb_guendouzi", "fb_greenwood", "fb_asensio", "fb_kerem", "fb_lukaku"],
    bench: ["fb_mertg", "fb_ismail", "fb_brown", "fb_muriqi", "fb_nene"]
  };
  TEAMS["bjk"] = {
    id: "bjk",
    name: "Be\u015Fikta\u015F",
    formation: FORMATION,
    tactics: { style: "counter", width: 65, depth: 50, pressing: 60, tempo: 65, passingRange: 55 },
    players: BJK_SQUAD,
    startingXI: ["bjk_ersin", "bjk_murillo", "bjk_agbadou", "bjk_uduokhai", "bjk_ridvan", "bjk_ndidi", "bjk_orkun", "bjk_olaitan", "bjk_cerny", "bjk_bilal", "bjk_oh"],
    bench: ["bjk_tayyip"]
  };
  TEAMS["ts"] = {
    id: "ts",
    name: "Trabzonspor",
    formation: FORMATION,
    tactics: { style: "direct", width: 60, depth: 55, pressing: 60, tempo: 60, passingRange: 60 },
    players: TS_SQUAD,
    startingXI: ["ts_onana", "ts_pina", "ts_savic", "ts_nwaiwu", "ts_lovik", "ts_bouchouari", "ts_okay", "ts_zubkov", "ts_muci", "ts_nwakaeme", "ts_onuachu"],
    bench: []
  };
  var NAME_MAP = {
    gs: "Galatasaray",
    fb: "Fenerbah\xE7e",
    bjk: "Be\u015Fikta\u015F",
    ts: "Trabzonspor",
    amed: "Amedspor",
    cor: "\xC7orum FK",
    riz: "\xC7aykur Rizespor",
    ala: "Alanyaspor",
    erz: "Erzurumspor",
    eyu: "Ey\xFCpspor",
    gaz: "Gaziantep FK",
    gen: "Gen\xE7lerbirli\u011Fi",
    goz: "G\xF6ztepe",
    ibfk: "Ba\u015Fak\u015Fehir",
    kas: "Kas\u0131mpa\u015Fa",
    koc: "Kocaelispor",
    sam: "Samsunspor",
    kon: "Konyaspor"
  };
  for (const id of Object.keys(TEAMS)) {
    if (NAME_MAP[id]) TEAMS[id].name = NAME_MAP[id];
  }
  var REGISTERED_SQUADS = {
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
          "name": "Yakup Giri\u015Fen",
          "position": "GK"
        },
        {
          "name": "Ali Turap B\xFClb\xFCl",
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
          "name": "Amadou Ciss\xE9",
          "position": "CB"
        },
        {
          "name": "Kahraman Demirta\u015F",
          "position": "CB"
        },
        {
          "name": "Cengiz Umut Mera\u015F",
          "position": "LB"
        },
        {
          "name": "Mehmet Ye\u015Fil",
          "position": "CB"
        },
        {
          "name": "G\xF6khan G\xFCl",
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
          "name": "Berk K\u0131z\u0131ldemir",
          "position": "RW"
        },
        {
          "name": "Mustafa Burak Bozan",
          "position": "GK"
        },
        {
          "name": "Mira\xE7 Acer",
          "position": "CB"
        },
        {
          "name": "Muhammed Hasan Y\u0131ld\u0131r\u0131m",
          "position": "LW"
        }
      ]
    },
    "cor": {
      "name": "\xC7orum FK",
      "players": [
        {
          "name": "Marcos Felipe",
          "position": "GK"
        },
        {
          "name": "Erhan Erent\xFCrk",
          "position": "GK"
        },
        {
          "name": "Arif \u015Eim\u015Fir",
          "position": "GK"
        },
        {
          "name": "G\xF6khan Sazda\u011F\u0131",
          "position": "RB"
        },
        {
          "name": "Alexandre Penetra",
          "position": "CB"
        },
        {
          "name": "\xC7a\u011Flar S\xF6y\xFCnc\xFC",
          "position": "CB"
        },
        {
          "name": "Hrvoje Smol\u010Di\u0107",
          "position": "CB"
        },
        {
          "name": "Serdar Saat\xE7\u0131",
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
          "name": "Berat \xD6zdemir",
          "position": "DM"
        },
        {
          "name": "Ylber Ramadani",
          "position": "DM"
        },
        {
          "name": "Mohamed Diomand\xE9",
          "position": "CM"
        },
        {
          "name": "Markus Karlsbakk",
          "position": "CM"
        },
        {
          "name": "Ahmed Ild\u0131z",
          "position": "CM"
        },
        {
          "name": "G\xF6ktan G\xFCrp\xFCz",
          "position": "AM"
        },
        {
          "name": "Ermin Mahmi\u0107",
          "position": "AM"
        },
        {
          "name": "Alexandros Kyziridis",
          "position": "LW"
        },
        {
          "name": "Cengiz \xDCnder",
          "position": "RW"
        },
        {
          "name": "Emircan G\xFCrl\xFCk",
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
          "name": "H\xFCseyin Bulut",
          "position": "RW"
        },
        {
          "name": "Atakan Akkaynak",
          "position": "CM"
        },
        {
          "name": "Furkan \xC7etinkaya",
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
      "name": "\xC7aykur Rizespor",
      "players": [
        {
          "name": "Yahia Fofana",
          "position": "GK"
        },
        {
          "name": "Zafer G\xF6rgen",
          "position": "GK"
        },
        {
          "name": "Efe Do\u011Fan",
          "position": "GK"
        },
        {
          "name": "Mithat Pala",
          "position": "RB"
        },
        {
          "name": "Taha \u015Eahin",
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
          "name": "Tayyip Talha Sanu\xE7",
          "position": "CB"
        },
        {
          "name": "Taylan Antalyal\u0131",
          "position": "DM"
        },
        {
          "name": "Moussa Diakit\xE9",
          "position": "DM"
        },
        {
          "name": "Qazim La\xE7i",
          "position": "CM"
        },
        {
          "name": "Can Bozdo\u011Fan",
          "position": "CM"
        },
        {
          "name": "Ibrahim Olawoyin",
          "position": "CM"
        },
        {
          "name": "Dal Varesanovi\u0107",
          "position": "AM"
        },
        {
          "name": "Valentin Mih\u0103il\u0103",
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
          "name": "Mustafa Co\u015Fkun Tosun",
          "position": "ST"
        },
        {
          "name": "Yakup Ayan",
          "position": "CB"
        },
        {
          "name": "Emirhan Y\u0131lmaz",
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
          "name": "Bedirhan \xD6zyurt",
          "position": "CB"
        },
        {
          "name": "Yusuf \xD6zdemir",
          "position": "LB"
        },
        {
          "name": "\u015Eahin Dik",
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
          "name": "\u0130zzet \xC7elik",
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
          "name": "Arda Usluo\u011Flu",
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
          "name": "\u0130brahim Kaya",
          "position": "AM"
        },
        {
          "name": "Bilal Demira\u011F",
          "position": "RW"
        },
        {
          "name": "H\xFCseyin \u015Een",
          "position": "LW"
        }
      ]
    },
    "erz": {
      "name": "Erzurumspor",
      "players": [
        {
          "name": "Mahmut Ertu\u011Frul Ta\u015Fk\u0131ran",
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
          "name": "Orhan Ovac\u0131kl\u0131",
          "position": "RB"
        },
        {
          "name": "Nihad Mujaki\u0107",
          "position": "CB"
        },
        {
          "name": "Mustafa Yumlu",
          "position": "CB"
        },
        {
          "name": "Yakup K\u0131rtay",
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
          "name": "Ibrahim Diabat\xE9",
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
          "name": "Sefa Akg\xFCn",
          "position": "CM"
        },
        {
          "name": "Emirhan Acar",
          "position": "CM"
        },
        {
          "name": "Taha \u0130brahim Ren\xE7ber",
          "position": "CB"
        },
        {
          "name": "\xD6mer Arda Kara",
          "position": "CB"
        },
        {
          "name": "Yi\u011Fit Baran Karao\u011Flan",
          "position": "GK"
        },
        {
          "name": "Emre Erdem",
          "position": "CM"
        },
        {
          "name": "Mustafa Fettaho\u011Flu",
          "position": "ST"
        },
        {
          "name": "Martin Rodriguez",
          "position": "LW"
        }
      ]
    },
    "eyu": {
      "name": "Ey\xFCpspor",
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
          "name": "Seyfettin An\u0131l Ya\u015Far",
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
          "name": "Ta\u015Fk\u0131n \u0130lter",
          "position": "DM"
        },
        {
          "name": "Hamza Yi\u011Fit Akman",
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
          "name": "Yusuf Baras\u0131",
          "position": "ST"
        },
        {
          "name": "Ahmed Abdullahi",
          "position": "ST"
        },
        {
          "name": "Musa Eren Karaka\u015F",
          "position": "ST"
        },
        {
          "name": "Talha \xDClvan",
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
          "name": "Burak I\u015F\u0131k",
          "position": "GK"
        },
        {
          "name": "Berhan Kutlay \u015Eatl\u0131",
          "position": "CM"
        },
        {
          "name": "Umut Keseci",
          "position": "LW"
        },
        {
          "name": "\xD6mer Ahmet Ceyhan",
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
          "name": "Arda K\u0131z\u0131lda\u011F",
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
          "name": "Luis P\xE9rez",
          "position": "RB"
        },
        {
          "name": "Kerim \xC7alhano\u011Flu",
          "position": "LB"
        },
        {
          "name": "Naz\u0131m Sangar\xE9",
          "position": "RB"
        },
        {
          "name": "Og\xFCn \xD6z\xE7i\xE7ek",
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
          "name": "Halil Dervi\u015Fo\u011Flu",
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
          "name": "Efe Sar\u0131kaya",
          "position": "CB"
        },
        {
          "name": "Ali Osman Kal\u0131n",
          "position": "LW"
        },
        {
          "name": "\u0130brahim Ka\u011Fan Alk\u0131\u015F",
          "position": "GK"
        },
        {
          "name": "Mehmet Samet Kalkan",
          "position": "CM"
        }
      ]
    },
    "gen": {
      "name": "Gen\xE7lerbirli\u011Fi",
      "players": [
        {
          "name": "\u0130rfan Can E\u011Fribayat",
          "position": "GK"
        },
        {
          "name": "G\xF6khan Akkan",
          "position": "GK"
        },
        {
          "name": "Dimitrios Goutas",
          "position": "CB"
        },
        {
          "name": "Metehan Baltac\u0131",
          "position": "CB"
        },
        {
          "name": "Thalisson",
          "position": "CB"
        },
        {
          "name": "Arda \xC7a\u011Fan \xC7elik",
          "position": "CB"
        },
        {
          "name": "Pedro Pereira",
          "position": "RB"
        },
        {
          "name": "F\u0131ratcan \xDCz\xFCm",
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
          "name": "Salih U\xE7an",
          "position": "CM"
        },
        {
          "name": "Franco Tongya",
          "position": "CM"
        },
        {
          "name": "O\u011Fulcan \xDClg\xFCn",
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
          "name": "Ensar \xC7avu\u015Fo\u011Flu",
          "position": "CB"
        },
        {
          "name": "G\xF6ktu\u011F Erdem",
          "position": "CM"
        },
        {
          "name": "Furkan Ayaz \xD6zcan",
          "position": "ST"
        },
        {
          "name": "Yi\u011Fit Hamza Aydar",
          "position": "LB"
        },
        {
          "name": "Seyfi Toprak K\u0131skan\xE7",
          "position": "CB"
        },
        {
          "name": "Berk Deniz \xC7ukurcu",
          "position": "CM"
        }
      ]
    },
    "goz": {
      "name": "G\xF6ztepe",
      "players": [
        {
          "name": "Luka Gugeshashvili",
          "position": "GK"
        },
        {
          "name": "Arda \xD6z\xE7imen",
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
          "name": "Taha Alt\u0131karde\u015F",
          "position": "CB"
        },
        {
          "name": "Furkan Bay\u0131r",
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
          "name": "Og\xFCn Bayrak",
          "position": "RB"
        },
        {
          "name": "Ege Y\u0131ld\u0131r\u0131m",
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
          "name": "Efkan Bekiro\u011Flu",
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
          "name": "G\xF6kdeniz Bayrakdar",
          "position": "RW"
        },
        {
          "name": "Bekir Tura\xE7 B\xF6ke",
          "position": "ST"
        },
        {
          "name": "Faustino Anjorin",
          "position": "CM"
        },
        {
          "name": "Berke Sar\u0131g\xFCl",
          "position": "GK"
        },
        {
          "name": "Boran Elig\xFCzel",
          "position": "CM"
        },
        {
          "name": "Deniz \u015Eeker",
          "position": "ST"
        }
      ]
    },
    "ibfk": {
      "name": "Ba\u015Fak\u015Fehir",
      "players": [
        {
          "name": "Muhammed \u015Eengezer",
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
          "name": "Hamza G\xFCreler",
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
          "name": "Onur Erg\xFCn",
          "position": "DM"
        },
        {
          "name": "Umut G\xFCne\u015F",
          "position": "CM"
        },
        {
          "name": "Olivier Kemen",
          "position": "CM"
        },
        {
          "name": "Berkay \xD6zcan",
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
          "name": "Yusuf Sar\u0131",
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
          "name": "Bertu\u011F Y\u0131ld\u0131r\u0131m",
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
          "name": "\xD6mer Ali \u015Eahiner",
          "position": "RB"
        },
        {
          "name": "G\xFCven Atalay",
          "position": "CM"
        }
      ]
    },
    "kas": {
      "name": "Kas\u0131mpa\u015Fa",
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
          "name": "\xD6mer Bayram",
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
          "name": "Atakan M\xFCjde",
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
          "name": "G\xFCven Yal\xE7\u0131n",
          "position": "ST"
        },
        {
          "name": "Adrian Benedyczak",
          "position": "ST"
        },
        {
          "name": "Muhammed Emin Bekta\u015F",
          "position": "ST"
        },
        {
          "name": "Sercan Deniz",
          "position": "LW"
        },
        {
          "name": "Sinan Alka\u015F",
          "position": "ST"
        },
        {
          "name": "Emirhan Boz",
          "position": "DM"
        },
        {
          "name": "Emirhan Yi\u011Fit",
          "position": "RW"
        },
        {
          "name": "Ahmet Taha Da\u011Fba\u015F\u0131",
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
          "name": "Serhat \xD6zta\u015Fdelen",
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
          "name": "Bedirhan Y\u0131ld\u0131z",
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
          "name": "U\u011Fur Kaan Y\u0131ld\u0131z",
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
          "name": "Gon\xE7alo Sousa",
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
          "name": "Tayfur Bing\xF6l",
          "position": "RW"
        },
        {
          "name": "Metehan Altunba\u015F",
          "position": "ST"
        },
        {
          "name": "Haydar Karata\u015F",
          "position": "RW"
        },
        {
          "name": "Hulusi Destici",
          "position": "ST"
        },
        {
          "name": "Arda \xD6zyar",
          "position": "CM"
        },
        {
          "name": "Onur \xD6ztonga",
          "position": "CB"
        },
        {
          "name": "Bedirhan Y\u0131ld\u0131z",
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
          "name": "Bilal Bayaz\u0131t",
          "position": "GK"
        },
        {
          "name": "Efe Yi\u011Fit \xDCst\xFCn",
          "position": "GK"
        },
        {
          "name": "Gabriele Guarino",
          "position": "CB"
        },
        {
          "name": "Igor Drapi\u0144ski",
          "position": "CB"
        },
        {
          "name": "Strahinja Erakovi\u0107",
          "position": "CB"
        },
        {
          "name": "Yunus Emre \xC7ift",
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
          "name": "Logi T\xF3masson",
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
          "name": "Celil Y\xFCksel",
          "position": "CM"
        },
        {
          "name": "Yal\xE7\u0131n Kayan",
          "position": "CM"
        },
        {
          "name": "Antoine Sekongo",
          "position": "CM"
        },
        {
          "name": "Oskar \xD8hlenschl\xE6ger",
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
          "name": "Jaur\xE8s Assoumou",
          "position": "LW"
        },
        {
          "name": "Emre K\u0131l\u0131n\xE7",
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
          "name": "Muhammet Talha Aky\xFCz",
          "position": "ST"
        },
        {
          "name": "Bedirhan \xC7etin",
          "position": "CB"
        }
      ]
    },
    "kon": {
      "name": "Konyaspor",
      "players": [
        {
          "name": "Deniz Erta\u015F",
          "position": "GK"
        },
        {
          "name": "Bahad\u0131r G\xFCng\xF6rd\xFC",
          "position": "GK"
        },
        {
          "name": "Alpha Kabinet Fofana",
          "position": "GK"
        },
        {
          "name": "Adil Demirba\u011F",
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
          "name": "U\u011Furcan Yaz\u011F\u0131l\u0131",
          "position": "CB"
        },
        {
          "name": "Arif Bo\u015Fluk",
          "position": "LB"
        },
        {
          "name": "Arthur Masuaku",
          "position": "LB"
        },
        {
          "name": "Ahmet O\u011Fuz",
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
          "name": "M\xFCcahit \u0130brahimoglu",
          "position": "DM"
        },
        {
          "name": "Diogo Gon\xE7alves",
          "position": "AM"
        },
        {
          "name": "Enis Bardhi",
          "position": "AM"
        },
        {
          "name": "Melih \u0130brahimoglu",
          "position": "CM"
        },
        {
          "name": "Ebrima Colley",
          "position": "LW"
        },
        {
          "name": "Jean-Luc Domp\xE9",
          "position": "LW"
        },
        {
          "name": "Emir Bars",
          "position": "LW"
        },
        {
          "name": "Deniz T\xFCr\xFC\xE7",
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
          "name": "Egemen Ayd\u0131n",
          "position": "GK"
        },
        {
          "name": "Ata Yan\u0131k",
          "position": "CB"
        },
        {
          "name": "\xD6mer \xC7obano\u011Flu",
          "position": "DM"
        }
      ]
    }
  };
  function makeRegisteredSquad(teamId, roster, power) {
    const scale = (value) => Math.max(1, Math.min(20, Math.round(value * (0.6 + power * 0.55))));
    return roster.map((entry, index) => {
      const pos = entry.position;
      const attrs = {};
      if (pos === "GK") Object.assign(attrs, { goalkeeping: scale(15), reflexes: scale(15), positioning: scale(14), decisions: scale(13) });
      else if (pos === "CB") Object.assign(attrs, { tackling: scale(15), marking: scale(15), heading: scale(14), strength: scale(14), positioning: scale(14) });
      else if (pos === "LB" || pos === "RB") Object.assign(attrs, { pace: scale(15), tackling: scale(13), crossing: scale(13), stamina: scale(14), workRate: scale(14) });
      else if (pos === "DM") Object.assign(attrs, { tackling: scale(14), marking: scale(13), passing: scale(13), stamina: scale(14), workRate: scale(15) });
      else if (pos === "CM") Object.assign(attrs, { passing: scale(14), vision: scale(13), technique: scale(13), stamina: scale(14), decisions: scale(13) });
      else if (pos === "AM") Object.assign(attrs, { passing: scale(14), vision: scale(15), technique: scale(15), dribbling: scale(14), shooting: scale(13) });
      else if (pos === "LW" || pos === "RW") Object.assign(attrs, { pace: scale(15), dribbling: scale(15), crossing: scale(13), shooting: scale(13), technique: scale(14) });
      else Object.assign(attrs, { shooting: scale(15), heading: scale(14), positioning: scale(15), strength: scale(14) });
      return {
        id: `${teamId}_real_${index + 1}`,
        name: entry.name,
        position: pos,
        condition: 90,
        morale: 75,
        attributes: baseAttrs(attrs)
      };
    });
  }
  function buildRegisteredTeam(id, entry) {
    const power = TEAM_POWERS[id]?.power ?? 0.5;
    const players = makeRegisteredSquad(id, entry.players, power);
    const pick2 = (positions, used2) => {
      const player = players.find((p) => positions.includes(p.position) && !used2.has(p.id));
      if (player) used2.add(player.id);
      return player?.id;
    };
    const used = /* @__PURE__ */ new Set();
    const startingXI = [
      pick2(["GK"], used),
      pick2(["RB"], used),
      pick2(["CB"], used),
      pick2(["CB"], used),
      pick2(["LB"], used),
      pick2(["DM"], used),
      pick2(["CM", "DM"], used),
      pick2(["RW"], used),
      pick2(["AM", "CM"], used),
      pick2(["LW"], used),
      pick2(["ST"], used)
    ].filter((id2) => Boolean(id2));
    for (const player of players) {
      if (startingXI.length >= 11) break;
      if (!used.has(player.id)) {
        used.add(player.id);
        startingXI.push(player.id);
      }
    }
    const bench = players.filter((p) => !used.has(p.id)).slice(0, 7).map((p) => p.id);
    return {
      id,
      name: entry.name,
      formation: FORMATION,
      tactics: { style: "wing_play", width: 65, depth: 55, pressing: 60, tempo: 60, passingRange: 55 },
      players,
      startingXI,
      bench
    };
  }
  delete TEAMS["kay"];
  delete TEAMS["ant"];
  delete TEAMS["kar"];
  for (const [id, entry] of Object.entries(REGISTERED_SQUADS)) {
    TEAMS[id] = buildRegisteredTeam(id, entry);
  }

  // player.ts
  var POSITION_ZONE_WEIGHTS = {
    RB: { 0: 1, 1: 0.35, 2: 0, 3: 0.85, 4: 0.25, 5: 0, 6: 0.6, 7: 0.15, 8: 0, 9: 0.35, 10: 0.05, 11: 0 },
    CB: { 0: 0.45, 1: 1, 2: 0.45, 3: 0.2, 4: 0.45, 5: 0.2, 6: 0.05, 7: 0.15, 8: 0.05, 9: 0, 10: 0.1, 11: 0 },
    LB: { 0: 0, 1: 0.35, 2: 1, 3: 0, 4: 0.25, 5: 0.85, 6: 0, 7: 0.15, 8: 0.6, 9: 0, 10: 0.05, 11: 0.35 },
    DM: { 0: 0.45, 1: 0.8, 2: 0.45, 3: 0.65, 4: 1, 5: 0.65, 6: 0.25, 7: 0.45, 8: 0.25, 9: 0.05, 10: 0.1, 11: 0.05 },
    CM: { 0: 0.25, 1: 0.4, 2: 0.25, 3: 0.75, 4: 1, 5: 0.75, 6: 0.55, 7: 0.8, 8: 0.55, 9: 0.2, 10: 0.35, 11: 0.2 },
    AM: { 0: 0.05, 1: 0.1, 2: 0.05, 3: 0.4, 4: 0.7, 5: 0.4, 6: 0.75, 7: 1, 8: 0.75, 9: 0.45, 10: 0.8, 11: 0.45 },
    RW: { 0: 0.15, 1: 0, 2: 0, 3: 0.65, 4: 0.25, 5: 0.05, 6: 0.95, 7: 0.55, 8: 0.15, 9: 1, 10: 0.7, 11: 0.1 },
    LW: { 0: 0, 1: 0, 2: 0.15, 3: 0.05, 4: 0.25, 5: 0.65, 6: 0.15, 7: 0.55, 8: 0.95, 9: 0.1, 10: 0.7, 11: 1 },
    ST: { 0: 0, 1: 0.05, 2: 0, 3: 0.1, 4: 0.25, 5: 0.1, 6: 0.35, 7: 0.6, 8: 0.35, 9: 0.65, 10: 1, 11: 0.65 }
  };

  // core.ts
  var FORMATION_SPECS = {
    "4-4-2": { name: "4-4-2", lines: [
      { line: "defense", lanes: ["right", "center", "center", "left"], positions: ["RB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["right", "center", "center", "left"], positions: ["RW", "CM", "CM", "LW"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "4-1-3-2": { name: "4-1-3-2", lines: [
      { line: "defense", lanes: ["right", "center", "center", "left"], positions: ["RB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["center"], positions: ["DM"] },
      { line: "attacking_mid", lanes: ["right", "center", "left"], positions: ["RW", "AM", "LW"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "4-1-2-1-2": { name: "4-1-2-1-2", lines: [
      { line: "defense", lanes: ["right", "center", "center", "left"], positions: ["RB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["center"], positions: ["DM"] },
      { line: "midfield", lanes: ["right", "left"], positions: ["CM", "CM"] },
      { line: "attacking_mid", lanes: ["center"], positions: ["AM"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "4-2-2-2": { name: "4-2-2-2", lines: [
      { line: "defense", lanes: ["right", "center", "center", "left"], positions: ["RB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["center", "center"], positions: ["DM", "DM"] },
      { line: "attacking_mid", lanes: ["right", "left"], positions: ["RW", "LW"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "4-2-3-1": { name: "4-2-3-1", lines: [
      { line: "defense", lanes: ["right", "center", "center", "left"], positions: ["RB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["center", "center"], positions: ["DM", "DM"] },
      { line: "attacking_mid", lanes: ["right", "center", "left"], positions: ["RW", "AM", "LW"] },
      { line: "attack", lanes: ["center"], positions: ["ST"] }
    ] },
    "4-2-1-2-1": { name: "4-2-1-2-1", lines: [
      { line: "defense", lanes: ["right", "center", "center", "left"], positions: ["RB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["center", "center"], positions: ["DM", "DM"] },
      { line: "attacking_mid", lanes: ["center"], positions: ["AM"] },
      { line: "attack", lanes: ["right", "left"], positions: ["ST", "ST"] },
      { line: "attack", lanes: ["center"], positions: ["ST"] }
    ] },
    "4-3-3": { name: "4-3-3", lines: [
      { line: "defense", lanes: ["right", "center", "center", "left"], positions: ["RB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["right", "center", "left"], positions: ["CM", "DM", "CM"] },
      { line: "attack", lanes: ["right", "center", "left"], positions: ["RW", "ST", "LW"] }
    ] },
    "4-3-2-1": { name: "4-3-2-1", lines: [
      { line: "defense", lanes: ["right", "center", "center", "left"], positions: ["RB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["right", "center", "left"], positions: ["CM", "DM", "CM"] },
      { line: "attacking_mid", lanes: ["center", "center"], positions: ["AM", "AM"] },
      { line: "attack", lanes: ["center"], positions: ["ST"] }
    ] },
    "4-3-1-2": { name: "4-3-1-2", lines: [
      { line: "defense", lanes: ["right", "center", "center", "left"], positions: ["RB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["right", "center", "left"], positions: ["CM", "DM", "CM"] },
      { line: "attacking_mid", lanes: ["center"], positions: ["AM"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "3-5-2": { name: "3-5-2", lines: [
      { line: "defense", lanes: ["center", "center", "center"], positions: ["CB", "CB", "CB"] },
      { line: "midfield", lanes: ["right", "center", "center", "center", "left"], positions: ["RB", "CM", "DM", "CM", "LB"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "3-1-4-2": { name: "3-1-4-2", lines: [
      { line: "defense", lanes: ["center", "center", "center"], positions: ["CB", "CB", "CB"] },
      { line: "midfield", lanes: ["center"], positions: ["DM"] },
      { line: "midfield", lanes: ["right", "center", "center", "left"], positions: ["RW", "CM", "CM", "LW"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "3-2-3-2": { name: "3-2-3-2", lines: [
      { line: "defense", lanes: ["center", "center", "center"], positions: ["CB", "CB", "CB"] },
      { line: "midfield", lanes: ["center", "center"], positions: ["DM", "DM"] },
      { line: "attacking_mid", lanes: ["right", "center", "left"], positions: ["RW", "AM", "LW"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "3-3-3-1": { name: "3-3-3-1", lines: [
      { line: "defense", lanes: ["center", "center", "center"], positions: ["CB", "CB", "CB"] },
      { line: "midfield", lanes: ["right", "center", "left"], positions: ["CM", "DM", "CM"] },
      { line: "attacking_mid", lanes: ["right", "center", "left"], positions: ["RW", "AM", "LW"] },
      { line: "attack", lanes: ["center"], positions: ["ST"] }
    ] },
    "3-4-3": { name: "3-4-3", lines: [
      { line: "defense", lanes: ["center", "center", "center"], positions: ["CB", "CB", "CB"] },
      { line: "midfield", lanes: ["right", "center", "center", "left"], positions: ["RW", "CM", "CM", "LW"] },
      { line: "attack", lanes: ["right", "center", "left"], positions: ["RW", "ST", "LW"] }
    ] },
    "3-4-2-1": { name: "3-4-2-1", lines: [
      { line: "defense", lanes: ["center", "center", "center"], positions: ["CB", "CB", "CB"] },
      { line: "midfield", lanes: ["right", "center", "center", "left"], positions: ["RW", "CM", "CM", "LW"] },
      { line: "attacking_mid", lanes: ["center", "center"], positions: ["AM", "AM"] },
      { line: "attack", lanes: ["center"], positions: ["ST"] }
    ] },
    "3-4-1-2": { name: "3-4-1-2", lines: [
      { line: "defense", lanes: ["center", "center", "center"], positions: ["CB", "CB", "CB"] },
      { line: "midfield", lanes: ["right", "center", "center", "left"], positions: ["RW", "CM", "CM", "LW"] },
      { line: "attacking_mid", lanes: ["center"], positions: ["AM"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "5-4-1": { name: "5-4-1", lines: [
      { line: "defense", lanes: ["right", "center", "center", "center", "left"], positions: ["RB", "CB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["right", "center", "center", "left"], positions: ["RW", "CM", "CM", "LW"] },
      { line: "attack", lanes: ["center"], positions: ["ST"] }
    ] },
    "5-3-2": { name: "5-3-2", lines: [
      { line: "defense", lanes: ["right", "center", "center", "center", "left"], positions: ["RB", "CB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["right", "center", "left"], positions: ["CM", "DM", "CM"] },
      { line: "attack", lanes: ["center", "center"], positions: ["ST", "ST"] }
    ] },
    "5-2-3": { name: "5-2-3", lines: [
      { line: "defense", lanes: ["right", "center", "center", "center", "left"], positions: ["RB", "CB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["center", "center"], positions: ["DM", "DM"] },
      { line: "attack", lanes: ["right", "center", "left"], positions: ["RW", "ST", "LW"] }
    ] },
    "5-5-0": { name: "5-5-0", lines: [
      { line: "defense", lanes: ["right", "center", "center", "center", "left"], positions: ["RB", "CB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["right", "center", "center", "center", "left"], positions: ["RW", "CM", "DM", "CM", "LW"] }
    ] },
    "5-3-1-1": { name: "5-3-1-1", lines: [
      { line: "defense", lanes: ["right", "center", "center", "center", "left"], positions: ["RB", "CB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["right", "center", "left"], positions: ["CM", "DM", "CM"] },
      { line: "attacking_mid", lanes: ["center"], positions: ["AM"] },
      { line: "attack", lanes: ["center"], positions: ["ST"] }
    ] },
    "5-2-2-1": { name: "5-2-2-1", lines: [
      { line: "defense", lanes: ["right", "center", "center", "center", "left"], positions: ["RB", "CB", "CB", "CB", "LB"] },
      { line: "midfield", lanes: ["center", "center"], positions: ["DM", "DM"] },
      { line: "attacking_mid", lanes: ["center", "center"], positions: ["AM", "AM"] },
      { line: "attack", lanes: ["center"], positions: ["ST"] }
    ] }
  };
  var LINE_ORDER = ["defense", "midfield", "attacking_mid", "attack"];
  var LANE_COL = {
    right: 0,
    center: 1,
    left: 2
  };
  var FORMATION_NAMES = Object.keys(
    FORMATION_SPECS
  );
  function buildFormationSlots(formation) {
    const spec = FORMATION_SPECS[formation];
    if (!spec) {
      throw new Error(`Bilinmeyen dizili\u015F: ${formation}`);
    }
    const slots = [
      { position: "GK", primaryZone: 1 }
    ];
    let currentRow = -1;
    for (const lineSpec of spec.lines) {
      if (lineSpec.lanes.length !== lineSpec.positions.length) {
        throw new Error(
          `${formation}: ${lineSpec.line} sat\u0131r\u0131nda mevki ve koridor say\u0131s\u0131 e\u015Fle\u015Fmiyor.`
        );
      }
      const baseRow = LINE_ORDER.indexOf(lineSpec.line);
      if (baseRow < 0) {
        throw new Error(
          `${formation}: ge\xE7ersiz saha hatt\u0131: ${lineSpec.line}`
        );
      }
      const row = Math.min(
        Math.max(baseRow, currentRow + 1),
        3
      );
      currentRow = row;
      for (let i = 0; i < lineSpec.positions.length; i++) {
        const lane = lineSpec.lanes[i];
        const column = LANE_COL[lane];
        if (column === void 0) {
          throw new Error(
            `${formation}: ge\xE7ersiz koridor: ${String(lane)}`
          );
        }
        const zone = row * 3 + column;
        if (zone < 0 || zone > 11) {
          throw new Error(
            `${formation}: ge\xE7ersiz saha b\xF6lgesi: ${zone}`
          );
        }
        slots.push({
          position: lineSpec.positions[i],
          primaryZone: zone
        });
      }
    }
    if (slots.length !== 11) {
      throw new Error(
        `${formation}: dizili\u015F 11 oyuncu \xFCretmeli; ${slots.length} slot \xFCretildi.`
      );
    }
    return slots;
  }
  function zoneWeight(player, zone) {
    if (player.position === "GK") {
      return zone === 1 ? 1 : 0;
    }
    return POSITION_ZONE_WEIGHTS[player.position]?.[zone] ?? 0;
  }
  function slotZoneWeight(player, slot, zone) {
    if (slot.position === "GK") {
      return zone === 1 ? 1 : 0;
    }
    const roleWeights = POSITION_ZONE_WEIGHTS[slot.position];
    if (roleWeights) {
      return roleWeights[zone] ?? 0;
    }
    return zoneWeight(player, zone);
  }
  function resolveLineup(team) {
    const slots = buildFormationSlots(team.formation);
    if (team.startingXI.length !== 11) {
      throw new Error(
        `${team.name}: startingXI 11 olmal\u0131, ${team.startingXI.length} verildi.`
      );
    }
    if (new Set(team.startingXI).size !== 11) {
      throw new Error(
        `${team.name}: ilk 11'de ayn\u0131 oyuncu birden fazla kez se\xE7ilmi\u015F.`
      );
    }
    const lineup = team.startingXI.map((id, index) => {
      const player = team.players.find((item) => item.id === id);
      if (!player) {
        throw new Error(
          `${team.name}: oyuncu bulunamad\u0131: ${id}`
        );
      }
      const slot = slots[index];
      if (!slot) {
        throw new Error(
          `${team.name}: ${index + 1}. dizili\u015F slotu bulunamad\u0131.`
        );
      }
      return { player, slot };
    });
    if (lineup[0].player.position !== "GK") {
      throw new Error(
        `${team.name}: ilk 11'in ilk oyuncusu kaleci olmal\u0131.`
      );
    }
    if (lineup.slice(1).some((item) => item.player.position === "GK")) {
      throw new Error(
        `${team.name}: kaleci saha oyuncusu slotuna yerle\u015Ftirilemez.`
      );
    }
    return lineup;
  }
  function pickBallCarrier(zone, lineup) {
    let best = null;
    let bestScore = -1;
    for (const { player, slot } of lineup) {
      if (slot.position === "GK" || player.position === "GK") {
        continue;
      }
      const baseWeight = slotZoneWeight(player, slot, zone);
      const slotBonus = slot.primaryZone === zone ? 0.3 : 0;
      const weight = baseWeight + slotBonus;
      if (weight <= 0) continue;
      const decisionSkill = (player.attributes.positioning + player.attributes.decisions) / 2;
      const condition = Math.max(
        0,
        Math.min(100, player.condition)
      ) / 100;
      const score = weight * decisionSkill * condition;
      if (score > bestScore) {
        bestScore = score;
        best = player;
      }
    }
    return best;
  }

  // pitch.ts
  var PITCH_ZONES = {
    0: { id: 0, name: "Sa\u011F Defans", row: "defense", lane: "right", mirrorZone: 11 },
    1: { id: 1, name: "Merkez Defans", row: "defense", lane: "center", mirrorZone: 10 },
    2: { id: 2, name: "Sol Defans", row: "defense", lane: "left", mirrorZone: 9 },
    3: { id: 3, name: "Sa\u011F Orta Saha", row: "midfield", lane: "right", mirrorZone: 8 },
    4: { id: 4, name: "Merkez Orta Saha", row: "midfield", lane: "center", mirrorZone: 7 },
    5: { id: 5, name: "Sol Orta Saha", row: "midfield", lane: "left", mirrorZone: 6 },
    6: { id: 6, name: "Sa\u011F Ofansif Orta", row: "attacking_mid", lane: "right", mirrorZone: 5 },
    7: { id: 7, name: "Orta Ofansif Orta", row: "attacking_mid", lane: "center", mirrorZone: 4 },
    8: { id: 8, name: "Sol Ofansif Orta", row: "attacking_mid", lane: "left", mirrorZone: 3 },
    9: { id: 9, name: "Sa\u011F Atak", row: "attack", lane: "right", mirrorZone: 2 },
    10: { id: 10, name: "Orta Atak (Ceza S.)", row: "attack", lane: "center", mirrorZone: 1 },
    11: { id: 11, name: "Sol Atak", row: "attack", lane: "left", mirrorZone: 0 }
  };
  var ZONE_NEIGHBORS = {
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

  // chance.ts
  var _seed = normalizeSeed(Date.now());
  function normalizeSeed(value) {
    if (!Number.isFinite(value)) {
      throw new Error(`Seed sonlu bir say\u0131 olmal\u0131: ${value}`);
    }
    const integer = Math.trunc(value);
    const normalized = (integer % 2147483647 + 2147483647) % 2147483647;
    return normalized || 1;
  }
  function rand() {
    _seed = _seed * 16807 % 2147483647;
    return (_seed - 1) / 2147483646;
  }
  function rng(max) {
    if (!Number.isInteger(max) || max <= 0) {
      throw new Error(`rng(max): max pozitif tam say\u0131 olmal\u0131: ${max}`);
    }
    return Math.floor(rand() * max);
  }
  function pick(items) {
    if (items.length === 0) {
      throw new Error("pick(): bo\u015F listeden se\xE7im yap\u0131lamaz.");
    }
    return items[rng(items.length)];
  }
  function chance(probability) {
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw new Error(
        `chance(p): olas\u0131l\u0131k 0-1 aras\u0131nda olmal\u0131: ${probability}`
      );
    }
    return rand() < probability;
  }
  function roll(attack, defense, floor = 0.15) {
    if (!Number.isFinite(attack) || !Number.isFinite(defense)) {
      throw new Error("roll(): h\xFCcum ve savunma g\xFC\xE7leri sonlu say\u0131 olmal\u0131.");
    }
    if (!Number.isFinite(floor) || floor < 0 || floor > 0.5) {
      throw new Error(`roll(): floor 0-0.5 aras\u0131nda olmal\u0131: ${floor}`);
    }
    const difference = attack - defense;
    const probability = Math.max(
      floor,
      Math.min(1 - floor, 0.5 + difference * 0.04)
    );
    return rand() < probability;
  }

  // rules.ts
  function clamp2(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function safePick(items) {
    if (items.length === 0) return void 0;
    return pick(items);
  }
  function getForwardZone(zone) {
    return Math.min(11, zone + 1);
  }
  function skill(player, attr) {
    const value = player.attributes[attr];
    const condition = clamp2(player.condition ?? 100, 0, 100);
    return value * (0.6 + 0.4 * condition / 100);
  }
  function findDefender(target, oppLineup) {
    if (oppLineup.length === 0) return null;
    const mirror = PITCH_ZONES[target]?.mirrorZone;
    if (mirror !== void 0) {
      const defender = pickBallCarrier(mirror, oppLineup) ?? pickBallCarrier(target, oppLineup);
      if (defender) return defender;
    }
    return safePick(oppLineup)?.player ?? null;
  }
  function checkFoul(defender) {
    if (!defender) {
      return {
        foul: false,
        card: null
      };
    }
    const aggression = clamp2(
      defender.attributes.aggression ?? 10,
      1,
      20
    );
    const foulChance = aggression / 20 * 0.15;
    if (!chance(foulChance)) {
      return {
        foul: false,
        card: null
      };
    }
    const cardChance = aggression / 20 * 0.3;
    let card = null;
    if (chance(cardChance * 0.1)) {
      card = "red";
    } else if (chance(cardChance)) {
      card = "yellow";
    }
    return {
      foul: true,
      card,
      playerId: defender.id
    };
  }
  function createFoulResult(defender, carrier, zone, card) {
    return {
      success: false,
      nextZone: zone,
      possessionChange: false,
      isFoul: true,
      isCard: card,
      foulPlayerId: defender.id,
      text: `Faul! ${defender.name}, ${carrier.name}'i durdurdu.`
    };
  }
  function resolvePass(carrier, target, oppLineup) {
    const defender = findDefender(target, oppLineup);
    const passValue = skill(carrier, "passing");
    const chaosFactor = chance(0.05) ? -5 : 0;
    const defenderValue = defender ? skill(defender, "tackling") * 0.35 : 4;
    const success = roll(
      passValue + chaosFactor,
      defenderValue,
      0.15
    );
    if (!success && defender) {
      const foul = checkFoul(defender);
      if (foul.foul) {
        return createFoulResult(
          defender,
          carrier,
          target,
          foul.card
        );
      }
    }
    return {
      success,
      nextZone: target,
      possessionChange: !success,
      text: success ? `${carrier.name} pas verdi (Zone ${target})` : `${carrier.name} pas\u0131 kesildi`
    };
  }
  function resolveShot(carrier, zone, oppLineup) {
    const goalkeeper = oppLineup.find(
      (item) => item.player.position === "GK"
    )?.player;
    const goalkeeperValue = goalkeeper ? skill(goalkeeper, "goalkeeping") * 0.7 + skill(goalkeeper, "reflexes") * 0.3 : 8;
    const distanceMultiplier = zone === 10 ? 1 : zone === 9 || zone === 11 ? 0.8 : 0.55;
    const shotPower = skill(carrier, "shooting") * distanceMultiplier;
    const hitPost = chance(0.03);
    const onTarget = !hitPost && roll(shotPower, 8, 0.1);
    const goalkeeperError = chance(0.02);
    const goalProbability = clamp2(
      shotPower / Math.max(1, goalkeeperValue * 1.5) * 0.45,
      0.1,
      0.5
    );
    const isGoal = (onTarget || goalkeeperError) && chance(goalProbability);
    let text;
    if (isGoal) {
      text = `GOL! ${carrier.name} (Zone ${zone})`;
    } else if (hitPost) {
      text = `Direkten d\xF6nd\xFC: ${carrier.name}`;
    } else if (goalkeeperError) {
      text = `Kaleci hatas\u0131, ancak gol olmad\u0131!`;
    } else if (onTarget) {
      text = `Kaleci kurtard\u0131: ${carrier.name}`;
    } else {
      text = `\u015Eut ka\xE7t\u0131: ${carrier.name}`;
    }
    return {
      success: isGoal,
      nextZone: 4,
      possessionChange: true,
      goal: isGoal,
      text
    };
  }
  function resolveDribble(carrier, zone, oppLineup) {
    const defender = findDefender(zone, oppLineup);
    const dribbleValue = skill(carrier, "dribbling");
    const defenderValue = defender ? skill(defender, "marking") : 5;
    const success = roll(
      dribbleValue,
      defenderValue,
      0.2
    );
    const nextZone = success ? Math.min(11, zone + 3) : zone;
    if (!success && defender && chance(0.1)) {
      const foul = checkFoul(defender);
      if (foul.foul) {
        return createFoulResult(
          defender,
          carrier,
          zone,
          foul.card
        );
      }
    }
    return {
      success,
      nextZone,
      possessionChange: !success,
      text: success ? `${carrier.name} adam ge\xE7ti (Zone ${nextZone})` : `${carrier.name} topu kaybetti`
    };
  }
  function resolveCross(carrier, zone, oppLineup, attackingLineup = []) {
    const availableAttackers = attackingLineup.filter(
      (item) => item.player.position !== "GK"
    );
    const striker = availableAttackers.find(
      (item) => item.player.position === "ST"
    )?.player ?? availableAttackers.map((item) => item.player).sort(
      (a, b) => skill(b, "heading") - skill(a, "heading")
    )[0] ?? carrier;
    const defender = findDefender(
      10,
      oppLineup
    );
    const crossValue = skill(carrier, "crossing");
    const defenderValue = defender ? skill(defender, "heading") * 0.5 + skill(defender, "strength") * 0.5 : 5;
    if (chance(0.2)) {
      return {
        success: false,
        nextZone: 10,
        possessionChange: false,
        isCorner: true,
        text: `${carrier.name}'in ortas\u0131 savunmaya \xE7arpt\u0131. Korner!`
      };
    }
    const crossSuccess = roll(
      crossValue,
      defenderValue,
      0.15
    );
    if (!crossSuccess && defender && chance(0.1)) {
      const foul = checkFoul(defender);
      if (foul.foul) {
        return createFoulResult(
          defender,
          carrier,
          zone,
          foul.card
        );
      }
    }
    if (crossSuccess) {
      const headerPower = skill(striker, "heading") * 0.7 + skill(striker, "strength") * 0.3;
      const headerSuccess = roll(
        headerPower,
        defenderValue,
        0.1
      );
      const isGoal = headerSuccess && chance(0.45);
      if (isGoal) {
        return {
          success: true,
          nextZone: 10,
          possessionChange: true,
          goal: true,
          text: `KAFA GOL\xDC! ${striker.name} (Orta: ${carrier.name})`
        };
      }
      return {
        success: true,
        nextZone: 10,
        possessionChange: false,
        text: `${carrier.name} orta yapt\u0131, kafa vuru\u015Fu sonu\xE7suz kald\u0131.`
      };
    }
    return {
      success: false,
      nextZone: 10,
      possessionChange: true,
      text: `${carrier.name}'in ortas\u0131 kesildi`
    };
  }
  function chooseAction(carrier, zone) {
    if (zone === 10 && chance(0.6)) {
      return "shot";
    }
    if ((zone === 9 || zone === 11) && chance(0.35)) {
      return "cross";
    }
    if (zone >= 6 && zone <= 8 && chance(0.1)) {
      return "shot";
    }
    if (skill(carrier, "dribbling") > 14 && chance(0.15)) {
      return "dribble";
    }
    return "pass";
  }
  function choosePassTarget(zone, carrier, style) {
    const neighbors = ZONE_NEIGHBORS[zone] ?? [];
    if (neighbors.length === 0) {
      return getForwardZone(zone);
    }
    const forward = neighbors.filter(
      (target) => target > zone
    );
    const backward = neighbors.filter(
      (target) => target < zone
    );
    if (style === "counter" && forward.length > 0 && chance(0.85)) {
      return pick(forward);
    }
    if (style === "possession" && backward.length > 0 && chance(0.4)) {
      return pick(backward);
    }
    if (skill(carrier, "longPassing") > 14 && chance(0.25)) {
      return pick(neighbors);
    }
    if (forward.length > 0 && chance(0.7)) {
      return pick(forward);
    }
    if (backward.length > 0 && chance(0.1)) {
      return pick(backward);
    }
    return pick(neighbors);
  }

  // match.ts
  function clamp3(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function cloneTeam(team) {
    return {
      ...team,
      tactics: { ...team.tactics },
      players: team.players.map((player) => ({
        ...player,
        attributes: { ...player.attributes }
      })),
      startingXI: [...team.startingXI],
      bench: [...team.bench]
    };
  }
  function simulateMatch(home, away) {
    const homeTeam = cloneTeam(home);
    const awayTeam = cloneTeam(away);
    const H = resolveLineup(homeTeam);
    const A = resolveLineup(awayTeam);
    for (const lineup of [H, A]) {
      for (const item of lineup) {
        item.player.condition = 95;
      }
    }
    const stats = {
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
    const st = {
      minute: 0,
      zone: 4,
      possession: "home",
      stats,
      events: []
    };
    const homeRedCards = /* @__PURE__ */ new Set();
    const awayRedCards = /* @__PURE__ */ new Set();
    const homeYellowCards = /* @__PURE__ */ new Map();
    const awayYellowCards = /* @__PURE__ */ new Map();
    const totalMinutes = 90 + rng(4);
    for (let min = 1; min <= totalMinutes; min++) {
      st.minute = min;
      const actions = 1 + rng(3);
      for (let actionIndex = 0; actionIndex < actions; actionIndex++) {
        const isHome = st.possession === "home";
        const atk = isHome ? H : A;
        const def = isHome ? A : H;
        const attackingRedCards = isHome ? homeRedCards : awayRedCards;
        const defendingRedCards = isHome ? awayRedCards : homeRedCards;
        const activeAtk = atk.filter(
          (item) => !attackingRedCards.has(item.player.id)
        );
        const activeDef = def.filter(
          (item) => !defendingRedCards.has(item.player.id)
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
        let result;
        if (action === "shot") {
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
        } else if (action === "cross") {
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
        } else if (action === "dribble") {
          result = resolveDribble(
            carrier,
            st.zone,
            activeDef
          );
        } else {
          const style = isHome ? homeTeam.tactics.style : awayTeam.tactics.style;
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
        if (result.isFoul) {
          if (isHome) {
            stats.awayFouls++;
          } else {
            stats.homeFouls++;
          }
          const offender = activeDef.find(
            (item) => item.player.id === result.foulPlayerId
          )?.player;
          if (result.isCard === "yellow") {
            if (isHome) {
              stats.awayYellowCards++;
            } else {
              stats.homeYellowCards++;
            }
            if (offender) {
              const yellowCards = isHome ? awayYellowCards : homeYellowCards;
              const previousCards = yellowCards.get(offender.id) ?? 0;
              const currentCards = previousCards + 1;
              yellowCards.set(
                offender.id,
                currentCards
              );
              if (currentCards >= 2) {
                if (isHome) {
                  stats.awayRedCards++;
                  awayRedCards.add(offender.id);
                } else {
                  stats.homeRedCards++;
                  homeRedCards.add(offender.id);
                }
                st.events.push(
                  `${min}' \u0130kinci sar\u0131 karttan k\u0131rm\u0131z\u0131 kart!`
                );
              }
            }
          } else if (result.isCard === "red") {
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
              `${min}' K\u0131rm\u0131z\u0131 kart!`
            );
          }
        }
        st.zone = result.nextZone;
        if (result.possessionChange) {
          st.possession = isHome ? "away" : "home";
        }
      }
      for (const item of H) {
        if (homeRedCards.has(item.player.id)) {
          continue;
        }
        item.player.condition = clamp3(
          item.player.condition - 0.2,
          20,
          100
        );
      }
      for (const item of A) {
        if (awayRedCards.has(item.player.id)) {
          continue;
        }
        item.player.condition = clamp3(
          item.player.condition - 0.2,
          20,
          100
        );
      }
    }
    return st;
  }

  // predict.ts
  function round1(value) {
    return Math.round(value * 10) / 10;
  }
  function round2(value) {
    return Math.round(value * 100) / 100;
  }
  function fairOdds(count, total, outcomeCount, margin = 1.05) {
    const probability = (count + 0.5) / (total + outcomeCount * 0.5);
    return round2(Math.max(1.01, margin / probability));
  }
  function predictMatch(home, away, sims = 1e4) {
    if (!Number.isInteger(sims) || sims < 1) {
      throw new Error(`Sim\xFClasyon say\u0131s\u0131 pozitif tam say\u0131 olmal\u0131: ${sims}`);
    }
    const H = typeof home === "string" ? TEAMS[home] : home;
    const A = typeof away === "string" ? TEAMS[away] : away;
    if (!H) {
      throw new Error(`Ev sahibi tak\u0131m bulunamad\u0131: ${String(home)}`);
    }
    if (!A) {
      throw new Error(`Deplasman tak\u0131m\u0131 bulunamad\u0131: ${String(away)}`);
    }
    if (H.id === A.id) {
      throw new Error("Ev sahibi ve deplasman tak\u0131m\u0131 ayn\u0131 olamaz.");
    }
    resolveLineup(H);
    resolveLineup(A);
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let totalGoals = 0;
    let over25 = 0;
    let bttsYes = 0;
    const scores = {};
    for (let i = 0; i < sims; i++) {
      const result = simulateMatch(H, A);
      const homeScore = result.homeScore;
      const awayScore = result.awayScore;
      if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore) || homeScore < 0 || awayScore < 0) {
        throw new Error(`Ma\xE7 sim\xFClasyonu ge\xE7ersiz skor \xFCretti: ${homeScore}-${awayScore}`);
      }
      if (homeScore > awayScore) {
        homeWins++;
      } else if (homeScore < awayScore) {
        awayWins++;
      } else {
        draws++;
      }
      const matchGoals = homeScore + awayScore;
      totalGoals += matchGoals;
      if (matchGoals >= 3) over25++;
      if (homeScore > 0 && awayScore > 0) bttsYes++;
      const score = `${homeScore}-${awayScore}`;
      scores[score] = (scores[score] ?? 0) + 1;
    }
    let mostLikelyScore = "0-0";
    let highestCount = -1;
    for (const [score, count] of Object.entries(scores)) {
      if (count > highestCount) {
        highestCount = count;
        mostLikelyScore = score;
      }
    }
    const homeWinPct = round1(homeWins / sims * 100);
    const drawPct = round1(draws / sims * 100);
    const awayWinPct = round1(awayWins / sims * 100);
    const over25Pct = round1(over25 / sims * 100);
    const under25Pct = round1(100 - over25 / sims * 100);
    const bttsPct = round1(bttsYes / sims * 100);
    const scoreDistribution = Object.fromEntries(
      Object.entries(scores).map(([score, count]) => [
        score,
        round1(count / sims * 100)
      ])
    );
    return {
      homeWinPct,
      drawPct,
      awayWinPct,
      avgGoals: round2(totalGoals / sims),
      over25Pct,
      under25Pct,
      bttsPct,
      mostLikelyScore,
      scoreDistribution,
      odds: {
        home: fairOdds(homeWins, sims, 3),
        draw: fairOdds(draws, sims, 3),
        away: fairOdds(awayWins, sims, 3),
        over25: fairOdds(over25, sims, 2),
        under25: fairOdds(sims - over25, sims, 2),
        bttsYes: fairOdds(bttsYes, sims, 2)
      }
    };
  }

  // browser.ts
  var POSITIONS = ["GK", "RB", "CB", "CB", "LB", "DM", "DM", "RW", "AM", "LW", "ST"];
  var STYLES = ["possession", "counter", "high_press", "low_block", "wing_play", "direct"];
  var STYLE_LABELS = {
    possession: "Tiki-Taka",
    counter: "Kontra Atak",
    high_press: "Y\xFCksek Pres",
    low_block: "Derin Savunma",
    wing_play: "Kanat Oyunu",
    direct: "Uzun Top"
  };
  var homeId = "gs";
  var awayId = "fb";
  function renderTeamSelector() {
    const ids = Object.keys(TEAMS);
    const homeSel = document.getElementById("home-select");
    const awaySel = document.getElementById("away-select");
    const opts = ids.map((id) => `<option value="${id}">${TEAMS[id].name}</option>`).join("");
    homeSel.innerHTML = opts;
    awaySel.innerHTML = opts;
    homeSel.value = homeId;
    awaySel.value = awayId;
    homeSel.onchange = () => {
      homeId = homeSel.value;
      if (homeId === awayId) {
        awayId = ids.find((i) => i !== homeId);
        awaySel.value = awayId;
      }
      renderAll();
    };
    awaySel.onchange = () => {
      awayId = awaySel.value;
      if (homeId === awayId) {
        homeId = ids.find((i) => i !== awayId);
        homeSel.value = homeId;
      }
      renderAll();
    };
  }
  function renderPanel(team, panelId, isHome) {
    const panel = document.getElementById(panelId);
    panel.innerHTML = `<h2>${team.name} ${isHome ? "(Ev)" : "(Dep)"}</h2>
    <div class="section"><div class="section-title">\u0130lk 11</div>
    ${team.startingXI.map((id, i) => {
      const used = new Set(team.startingXI.filter((_, j) => j !== i));
      return `<div class="player-slot">${POSITIONS[i]}<select data-team="${team.id}" data-idx="${i}">
        ${team.players.filter((pl) => !used.has(pl.id)).map((pl) => `<option value="${pl.id}" ${pl.id === id ? "selected" : ""}>${pl.name} (${pl.position})</option>`).join("")}
      </select></div>`;
    }).join("")}
    </div>
    <div class="section"><div class="section-title">Taktik</div>
    <div class="tactics"><label>Stil<select id="style-${team.id}">
        ${STYLES.map((s) => `<option value="${s}" ${team.tactics.style === s ? "selected" : ""}>${STYLE_LABELS[s]}</option>`).join("")}
    </select></label></div></div>`;
    panel.querySelectorAll("select[data-team]").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const idx = parseInt(sel.dataset.idx);
        TEAMS[team.id].startingXI[idx] = e.target.value;
        renderPanel(team, panelId, isHome);
      });
    });
    const styleSel = document.getElementById(`style-${team.id}`);
    styleSel?.addEventListener("change", () => {
      TEAMS[team.id].tactics.style = styleSel.value;
    });
  }
  function renderAll() {
    const home = TEAMS[homeId], away = TEAMS[awayId];
    renderPanel(home, "home-panel", true);
    renderPanel(away, "away-panel", false);
    document.getElementById("vs-label").textContent = `${home.name} vs ${away.name}`;
    document.getElementById("result").style.display = "none";
  }
  document.getElementById("sim-btn").addEventListener("click", () => {
    const btn = document.getElementById("sim-btn");
    btn.disabled = true;
    btn.textContent = "\u23F3 Hesaplan\u0131yor...";
    setTimeout(() => {
      try {
        const home = TEAMS[homeId], away = TEAMS[awayId];
        const p = predictMatch(home, away, 1e4);
        const r = document.getElementById("result");
        r.style.display = "block";
        const fmt = (val) => isFinite(val) && !isNaN(val) ? val : 0;
        r.innerHTML = `<h2>${home.name} vs ${away.name} \u2014 Sonu\xE7</h2>
        <div class="odds-grid">
          <div class="odds-cell"><div class="label">${home.name}</div><div class="value">${fmt(p.odds.home)}</div><div class="pct">%${fmt(p.homeWinPct)}</div></div>
          <div class="odds-cell"><div class="label">Beraberlik</div><div class="value">${fmt(p.odds.draw)}</div><div class="pct">%${fmt(p.drawPct)}</div></div>
          <div class="odds-cell"><div class="label">${away.name}</div><div class="value">${fmt(p.odds.away)}</div><div class="pct">%${fmt(p.awayWinPct)}</div></div>
        </div>
        <p>En Olas\u0131: <b>${p.mostLikelyScore}</b> \xB7 Ort. Gol: ${fmt(p.avgGoals)} \xB7 2.5 \xDCst: %${fmt(p.over25Pct)} \xB7 KG: %${fmt(p.bttsPct)}</p>
        <div class="score-list">${Object.entries(p.scoreDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, v]) => `<div class="score-item"><div class="score">${s}</div>%${fmt(v)}</div>`).join("")}</div>`;
      } catch (err) {
        alert("Sim\xFClasyon Hatas\u0131: " + err);
        console.error(err);
      } finally {
        btn.disabled = false;
        btn.textContent = "\u{1F3B2} S\u0130M\xDCLE ET (10.000)";
      }
    }, 10);
  });
  renderTeamSelector();
  renderAll();
})();
