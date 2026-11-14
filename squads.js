"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEAMS = void 0;
const teamPower_1 = require("./teamPower");
function baseAttrs(o = {}) {
    return {
        passing: 12, longPassing: 12, crossing: 10, shooting: 10, dribbling: 12, technique: 12,
        tackling: 10, marking: 10, heading: 10, vision: 12, positioning: 12, decisions: 12, composure: 12,
        pace: 12, stamina: 13, strength: 12, agility: 12, workRate: 13, aggression: 12,
        goalkeeping: 1, reflexes: 1, ...o,
    };
}
// ── GS gerçek kadro ────────────────────────────────────────
const GS_SQUAD = [
    { id: 'gs_ugurcan', name: 'Uğurcan Çakır', position: 'GK', condition: 90, morale: 82, attributes: baseAttrs({ goalkeeping: 17, reflexes: 16, positioning: 16 }) },
    { id: 'gs_gunay', name: 'Günay Güvenç', position: 'GK', condition: 90, morale: 70, attributes: baseAttrs({ goalkeeping: 14, reflexes: 14 }) },
    { id: 'gs_sanchez', name: 'Davinson Sánchez', position: 'CB', condition: 90, morale: 82, attributes: baseAttrs({ tackling: 17, marking: 16, heading: 16, strength: 17, pace: 15 }) },
    { id: 'gs_bardakci', name: 'Abdülkerim Bardakcı', position: 'CB', condition: 90, morale: 78, attributes: baseAttrs({ tackling: 15, marking: 15, heading: 15, passing: 14 }) },
    { id: 'gs_jakobs', name: 'Ismail Jakobs', position: 'LB', condition: 90, morale: 77, attributes: baseAttrs({ pace: 16, crossing: 15, passing: 14, workRate: 15 }) },
    { id: 'gs_singo', name: 'Wilfried Singo', position: 'RB', condition: 90, morale: 78, attributes: baseAttrs({ pace: 17, tackling: 15, workRate: 16, crossing: 13 }) },
    { id: 'gs_torreira', name: 'Lucas Torreira', position: 'DM', condition: 90, morale: 84, attributes: baseAttrs({ tackling: 17, marking: 16, passing: 15, vision: 14, workRate: 18, aggression: 16 }) },
    { id: 'gs_ilkay', name: 'İlkay Gündoğan', position: 'CM', condition: 90, morale: 84, attributes: baseAttrs({ passing: 18, vision: 17, technique: 17, decisions: 17, composure: 17, shooting: 14 }) },
    { id: 'gs_sara', name: 'Gabriel Sara', position: 'CM', condition: 90, morale: 80, attributes: baseAttrs({ passing: 16, vision: 16, technique: 16, shooting: 14 }) },
    { id: 'gs_lang', name: 'Noa Lang', position: 'RW', condition: 90, morale: 80, attributes: baseAttrs({ pace: 17, dribbling: 16, shooting: 14, crossing: 14, technique: 15 }) },
    { id: 'gs_sane', name: 'Leroy Sané', position: 'LW', condition: 90, morale: 82, attributes: baseAttrs({ pace: 18, dribbling: 17, shooting: 15, crossing: 15, technique: 17 }) },
    { id: 'gs_osimhen', name: 'Victor Osimhen', position: 'ST', condition: 90, morale: 88, attributes: baseAttrs({ shooting: 18, heading: 17, positioning: 18, composure: 17, strength: 17, pace: 17 }) },
    { id: 'gs_yunus', name: 'Yunus Akgün', position: 'AM', condition: 90, morale: 78, attributes: baseAttrs({ passing: 15, vision: 15, technique: 16, dribbling: 15, shooting: 13 }) },
    { id: 'gs_icardi', name: 'Mauro Icardi', position: 'ST', condition: 90, morale: 84, attributes: baseAttrs({ shooting: 18, heading: 16, positioning: 18, composure: 17 }) },
    { id: 'gs_baris', name: 'Barış Alper Yılmaz', position: 'RW', condition: 90, morale: 78, attributes: baseAttrs({ pace: 18, workRate: 16, dribbling: 14, crossing: 13 }) },
    { id: 'gs_lemia', name: 'Mario Lemina', position: 'DM', condition: 90, morale: 76, attributes: baseAttrs({ tackling: 15, marking: 14, passing: 13, workRate: 15 }) },
    { id: 'gs_berkan', name: 'Berkan Kutlu', position: 'CM', condition: 90, morale: 74, attributes: baseAttrs({ passing: 13, stamina: 16, workRate: 15 }) },
];
// ── FB gerçek kadro ────────────────────────────────────────
const FB_SQUAD = [
    { id: 'fb_ederson', name: 'Ederson', position: 'GK', condition: 90, morale: 84, attributes: baseAttrs({ goalkeeping: 18, reflexes: 17, positioning: 17 }) },
    { id: 'fb_mertg', name: 'Mert Günok', position: 'GK', condition: 90, morale: 70, attributes: baseAttrs({ goalkeeping: 14, reflexes: 14 }) },
    { id: 'fb_skriniar', name: 'Milan Škriniar', position: 'CB', condition: 90, morale: 82, attributes: baseAttrs({ tackling: 17, marking: 17, heading: 17, strength: 17 }) },
    { id: 'fb_ake', name: 'Nathan Aké', position: 'CB', condition: 90, morale: 80, attributes: baseAttrs({ tackling: 16, marking: 16, heading: 15, strength: 15 }) },
    { id: 'fb_ooster', name: 'Jayden Oosterwolde', position: 'LB', condition: 90, morale: 78, attributes: baseAttrs({ pace: 17, tackling: 15, workRate: 16, crossing: 13 }) },
    { id: 'fb_brown', name: 'Archie Brown', position: 'LB', condition: 90, morale: 76, attributes: baseAttrs({ pace: 17, crossing: 15, passing: 14 }) },
    { id: 'fb_semedo', name: 'Nélson Semedo', position: 'RB', condition: 90, morale: 78, attributes: baseAttrs({ pace: 16, tackling: 15, workRate: 15 }) },
    { id: 'fb_ismail', name: 'İsmail Yüksek', position: 'DM', condition: 90, morale: 78, attributes: baseAttrs({ tackling: 16, marking: 15, passing: 14, workRate: 16 }) },
    { id: 'fb_kante', name: "N'Golo Kanté", position: 'DM', condition: 90, morale: 82, attributes: baseAttrs({ tackling: 18, marking: 17, workRate: 18, passing: 14 }) },
    { id: 'fb_guendouzi', name: 'Mattéo Guendouzi', position: 'CM', condition: 90, morale: 82, attributes: baseAttrs({ passing: 16, vision: 16, technique: 15, workRate: 16 }) },
    { id: 'fb_asensio', name: 'Marco Asensio', position: 'AM', condition: 90, morale: 84, attributes: baseAttrs({ passing: 17, vision: 17, technique: 17, shooting: 16 }) },
    { id: 'fb_kerem', name: 'Kerem Aktürkoğlu', position: 'LW', condition: 90, morale: 80, attributes: baseAttrs({ pace: 17, dribbling: 16, shooting: 15, crossing: 15 }) },
    { id: 'fb_nene', name: 'Dorgeles Nene', position: 'RW', condition: 90, morale: 78, attributes: baseAttrs({ pace: 16, dribbling: 15, shooting: 14, crossing: 14 }) },
    { id: 'fb_greenwood', name: 'Mason Greenwood', position: 'RW', condition: 90, morale: 82, attributes: baseAttrs({ pace: 16, dribbling: 16, shooting: 16, crossing: 14 }) },
    { id: 'fb_lukaku', name: 'Romelu Lukaku', position: 'ST', condition: 90, morale: 82, attributes: baseAttrs({ shooting: 17, heading: 18, positioning: 16, strength: 18 }) },
    { id: 'fb_muriqi', name: 'Vedat Muriqi', position: 'ST', condition: 90, morale: 78, attributes: baseAttrs({ shooting: 15, heading: 17, positioning: 15, strength: 17 }) },
];
// ── BJK gerçek kadro ───────────────────────────────────────
const BJK_SQUAD = [
    { id: 'bjk_ersin', name: 'Ersin Destanoğlu', position: 'GK', condition: 90, morale: 78, attributes: baseAttrs({ goalkeeping: 15, reflexes: 15 }) },
    { id: 'bjk_murillo', name: 'Amir Murillo', position: 'RB', condition: 90, morale: 78, attributes: baseAttrs({ pace: 17, tackling: 14, workRate: 16 }) },
    { id: 'bjk_agbadou', name: 'Emmanuel Agbadou', position: 'CB', condition: 90, morale: 80, attributes: baseAttrs({ tackling: 16, marking: 15, heading: 16, strength: 17 }) },
    { id: 'bjk_uduokhai', name: 'Felix Uduokhai', position: 'CB', condition: 90, morale: 78, attributes: baseAttrs({ tackling: 15, marking: 15, heading: 15 }) },
    { id: 'bjk_ridvan', name: 'Rıdvan Yılmaz', position: 'LB', condition: 90, morale: 76, attributes: baseAttrs({ pace: 16, crossing: 14, workRate: 15 }) },
    { id: 'bjk_ndidi', name: 'Wilfred Ndidi', position: 'DM', condition: 90, morale: 82, attributes: baseAttrs({ tackling: 17, marking: 16, workRate: 17 }) },
    { id: 'bjk_orkun', name: 'Orkun Kökçü', position: 'CM', condition: 90, morale: 82, attributes: baseAttrs({ passing: 17, vision: 16, technique: 16, shooting: 15 }) },
    { id: 'bjk_cerny', name: 'Vaclav Cerny', position: 'AM', condition: 90, morale: 78, attributes: baseAttrs({ passing: 15, vision: 15, technique: 15, shooting: 14 }) },
    { id: 'bjk_olaitan', name: 'Junior Olaitan', position: 'RW', condition: 90, morale: 76, attributes: baseAttrs({ pace: 16, dribbling: 15, crossing: 13 }) },
    { id: 'bjk_bilal', name: 'El Bilal Touré', position: 'ST', condition: 90, morale: 78, attributes: baseAttrs({ shooting: 16, heading: 15, positioning: 15, pace: 15 }) },
    { id: 'bjk_oh', name: 'Hyeon-gyu Oh', position: 'ST', condition: 90, morale: 78, attributes: baseAttrs({ shooting: 15, heading: 16, positioning: 15 }) },
    { id: 'bjk_tayyip', name: 'Tayyip Talha Sanuç', position: 'CB', condition: 90, morale: 74, attributes: baseAttrs({ tackling: 14, marking: 14, heading: 15 }) },
];
// ── TS gerçek kadro ────────────────────────────────────────
const TS_SQUAD = [
    { id: 'ts_onana', name: 'André Onana', position: 'GK', condition: 90, morale: 82, attributes: baseAttrs({ goalkeeping: 17, reflexes: 16, positioning: 16 }) },
    { id: 'ts_savic', name: 'Stefan Savić', position: 'CB', condition: 90, morale: 78, attributes: baseAttrs({ tackling: 16, marking: 16, heading: 15 }) },
    { id: 'ts_nwaiwu', name: 'Chibuike Nwaiwu', position: 'CB', condition: 90, morale: 76, attributes: baseAttrs({ tackling: 15, marking: 14, heading: 15 }) },
    { id: 'ts_pina', name: 'Wagner Pina', position: 'RB', condition: 90, morale: 76, attributes: baseAttrs({ pace: 16, tackling: 14, workRate: 15 }) },
    { id: 'ts_lovik', name: 'Mathias Løvik', position: 'LB', condition: 90, morale: 74, attributes: baseAttrs({ pace: 15, crossing: 14, workRate: 14 }) },
    { id: 'ts_bouchouari', name: 'Benjamin Bouchouari', position: 'CM', condition: 90, morale: 78, attributes: baseAttrs({ passing: 16, vision: 15, technique: 15 }) },
    { id: 'ts_muci', name: 'Ernest Muçi', position: 'AM', condition: 90, morale: 80, attributes: baseAttrs({ passing: 16, vision: 15, technique: 16, shooting: 15 }) },
    { id: 'ts_zubkov', name: 'Oleksandr Zubkov', position: 'RW', condition: 90, morale: 78, attributes: baseAttrs({ pace: 16, dribbling: 15, crossing: 14 }) },
    { id: 'ts_nwakaeme', name: 'Anthony Nwakaeme', position: 'LW', condition: 90, morale: 80, attributes: baseAttrs({ pace: 15, dribbling: 16, shooting: 15 }) },
    { id: 'ts_onuachu', name: 'Paul Onuachu', position: 'ST', condition: 90, morale: 84, attributes: baseAttrs({ shooting: 17, heading: 18, positioning: 16, strength: 17 }) },
    { id: 'ts_okay', name: 'Okay Yokuşlu', position: 'DM', condition: 90, morale: 76, attributes: baseAttrs({ tackling: 15, marking: 15, passing: 13, workRate: 15 }) },
];
// ── Otomatik kadro üretici (diğer 14 takım) ────────────────
function makeSquad(teamId, power) {
    const s = (b) => Math.max(1, Math.min(20, Math.round(b * (0.6 + power * 0.55))));
    const mk = (id, name, pos, ov) => ({
        id: `${teamId}_${id}`, name, position: pos, condition: 90, morale: 75,
        attributes: baseAttrs({
            passing: s(12), longPassing: s(11), crossing: s(10), shooting: s(10), dribbling: s(11), technique: s(11),
            tackling: s(10), marking: s(10), heading: s(10), vision: s(11), positioning: s(11), decisions: s(11),
            composure: s(11), pace: s(12), stamina: s(13), strength: s(12), agility: s(12), workRate: s(13), aggression: s(12), ...ov,
        }),
    });
    return [
        mk('gk1', 'Kaleci', 'GK', { goalkeeping: s(15), reflexes: s(15), positioning: s(14) }),
        mk('rb1', 'Sağ Bek', 'RB', { pace: s(15), tackling: s(13), workRate: s(14) }),
        mk('cb1', 'Stoper 1', 'CB', { tackling: s(15), marking: s(14), heading: s(14) }),
        mk('cb2', 'Stoper 2', 'CB', { tackling: s(14), marking: s(13), heading: s(13) }),
        mk('lb1', 'Sol Bek', 'LB', { pace: s(14), tackling: s(13), workRate: s(14) }),
        mk('dm1', 'Ön Libero', 'DM', { tackling: s(15), marking: s(14), passing: s(13), workRate: s(15) }),
        mk('dm2', 'Merkez', 'DM', { passing: s(14), tackling: s(13), vision: s(13) }),
        mk('rw1', 'Sağ Açık', 'RW', { pace: s(15), dribbling: s(15), shooting: s(13) }),
        mk('am1', '10 Numara', 'AM', { passing: s(15), vision: s(15), technique: s(15) }),
        mk('lw1', 'Sol Açık', 'LW', { pace: s(15), dribbling: s(14), shooting: s(13) }),
        mk('st1', 'Santrfor', 'ST', { shooting: s(16), heading: s(14), positioning: s(15) }),
        mk('gk2', 'Yedek GK', 'GK', { goalkeeping: s(12), reflexes: s(12) }),
        mk('cb3', 'Yedek CB', 'CB', { tackling: s(13), marking: s(12) }),
        mk('rb2', 'Yedek RB', 'RB', { pace: s(13), tackling: s(11) }),
        mk('cm1', 'Yedek CM', 'CM', { passing: s(13), vision: s(12) }),
        mk('cm2', 'Yedek CM', 'CM', { passing: s(12), vision: s(11) }),
        mk('rw2', 'Yedek RW', 'RW', { pace: s(13), dribbling: s(12) }),
        mk('st2', 'Yedek ST', 'ST', { shooting: s(13), positioning: s(12) }),
    ];
}
// ── Takımları oluştur ──────────────────────────────────────
const FORMATION = '4-2-3-1';
const F = (id) => [`${id}_gk1`, `${id}_rb1`, `${id}_cb1`, `${id}_cb2`, `${id}_lb1`, `${id}_dm1`, `${id}_dm2`, `${id}_rw1`, `${id}_am1`, `${id}_lw1`, `${id}_st1`];
const B = (id) => [`${id}_gk2`, `${id}_cb3`, `${id}_rb2`, `${id}_cm1`, `${id}_cm2`, `${id}_rw2`, `${id}_st2`];
exports.TEAMS = {};
// Önce otomatik üret (18 takım tamamı)
for (const [id, p] of Object.entries(teamPower_1.TEAM_POWERS)) {
    const squad = makeSquad(id, p.power);
    exports.TEAMS[id] = {
        id, name: id.toUpperCase(), formation: FORMATION,
        tactics: { style: 'wing_play', width: 70, depth: 60, pressing: 65, tempo: 60, passingRange: 55 },
        players: squad, startingXI: F(id), bench: B(id),
    };
}
// Gerçek kadroları overwrite et
exports.TEAMS['gs'] = {
    id: 'gs', name: 'Galatasaray', formation: FORMATION,
    tactics: { style: 'wing_play', width: 75, depth: 60, pressing: 70, tempo: 65, passingRange: 55 },
    players: GS_SQUAD,
    startingXI: ['gs_ugurcan', 'gs_singo', 'gs_sanchez', 'gs_bardakci', 'gs_jakobs', 'gs_torreira', 'gs_ilkay', 'gs_lang', 'gs_yunus', 'gs_sane', 'gs_osimhen'],
    bench: ['gs_gunay', 'gs_lemia', 'gs_berkan', 'gs_sara', 'gs_baris', 'gs_icardi'],
};
exports.TEAMS['fb'] = {
    id: 'fb', name: 'Fenerbahçe', formation: FORMATION,
    tactics: { style: 'possession', width: 70, depth: 55, pressing: 65, tempo: 60, passingRange: 65 },
    players: FB_SQUAD,
    startingXI: ['fb_ederson', 'fb_semedo', 'fb_skriniar', 'fb_ake', 'fb_ooster', 'fb_kante', 'fb_guendouzi', 'fb_greenwood', 'fb_asensio', 'fb_kerem', 'fb_lukaku'],
    bench: ['fb_mertg', 'fb_ismail', 'fb_brown', 'fb_muriqi', 'fb_nene'],
};
exports.TEAMS['bjk'] = {
    id: 'bjk', name: 'Beşiktaş', formation: FORMATION,
    tactics: { style: 'counter', width: 65, depth: 50, pressing: 60, tempo: 65, passingRange: 55 },
    players: BJK_SQUAD,
    startingXI: ['bjk_ersin', 'bjk_murillo', 'bjk_agbadou', 'bjk_uduokhai', 'bjk_ridvan', 'bjk_ndidi', 'bjk_orkun', 'bjk_olaitan', 'bjk_cerny', 'bjk_bilal', 'bjk_oh'],
    bench: ['bjk_tayyip'],
};
exports.TEAMS['ts'] = {
    id: 'ts', name: 'Trabzonspor', formation: FORMATION,
    tactics: { style: 'direct', width: 60, depth: 55, pressing: 60, tempo: 60, passingRange: 60 },
    players: TS_SQUAD,
    startingXI: ['ts_onana', 'ts_pina', 'ts_savic', 'ts_nwaiwu', 'ts_lovik', 'ts_bouchouari', 'ts_okay', 'ts_zubkov', 'ts_muci', 'ts_nwakaeme', 'ts_onuachu'],
    bench: [],
};
// Takım adlarını düzelt (otomatik üretilenler için)
const NAME_MAP = {
    gs: 'Galatasaray', fb: 'Fenerbahçe', bjk: 'Beşiktaş', ts: 'Trabzonspor',
    ibfk: 'Başakşehir', goz: 'Göztepe', sam: 'Samsunspor', riz: 'Rizespor',
    kon: 'Konyaspor', ala: 'Alanyaspor', gaz: 'Gaziantep FK', kas: 'Kasımpaşa',
    kay: 'Kayserispor', ant: 'Antalyaspor', eyu: 'Eyüpspor', koc: 'Kocaelispor',
    gen: 'Gençlerbirliği', kar: 'Karagümrük',
};
for (const id of Object.keys(exports.TEAMS)) {
    if (NAME_MAP[id])
        exports.TEAMS[id].name = NAME_MAP[id];
}
