"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TACTIC_EFFECTS = exports.FORMATION_SPECS = void 0;
exports.buildFormationSlots = buildFormationSlots;
exports.zoneWeight = zoneWeight;
exports.resolveLineup = resolveLineup;
exports.calculateZonePowers = calculateZonePowers;
exports.applyTacticModifiers = applyTacticModifiers;
exports.pickBallCarrier = pickBallCarrier;
const player_1 = require("./player");
exports.FORMATION_SPECS = {
    '4-4-2': { name: '4-4-2', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['right', 'center', 'center', 'left'], positions: ['RW', 'CM', 'CM', 'LW'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '4-1-3-2': { name: '4-1-3-2', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['center'], positions: ['DM'] },
            { line: 'attacking_mid', lanes: ['right', 'center', 'left'], positions: ['RW', 'AM', 'LW'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '4-1-2-1-2': { name: '4-1-2-1-2', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['center'], positions: ['DM'] },
            { line: 'midfield', lanes: ['right', 'left'], positions: ['CM', 'CM'] },
            { line: 'attacking_mid', lanes: ['center'], positions: ['AM'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '4-2-2-2': { name: '4-2-2-2', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['center', 'center'], positions: ['DM', 'DM'] },
            { line: 'attacking_mid', lanes: ['right', 'left'], positions: ['RW', 'LW'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '4-2-3-1': { name: '4-2-3-1', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['center', 'center'], positions: ['DM', 'DM'] },
            { line: 'attacking_mid', lanes: ['right', 'center', 'left'], positions: ['RW', 'AM', 'LW'] },
            { line: 'attack', lanes: ['center'], positions: ['ST'] }
        ] },
    '4-2-1-2-1': { name: '4-2-1-2-1', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['center', 'center'], positions: ['DM', 'DM'] },
            { line: 'attacking_mid', lanes: ['center'], positions: ['AM'] },
            { line: 'attack', lanes: ['right', 'left'], positions: ['ST', 'ST'] },
            { line: 'attack', lanes: ['center'], positions: ['ST'] }
        ] },
    '4-3-3': { name: '4-3-3', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['right', 'center', 'left'], positions: ['CM', 'DM', 'CM'] },
            { line: 'attack', lanes: ['right', 'center', 'left'], positions: ['RW', 'ST', 'LW'] }
        ] },
    '4-3-2-1': { name: '4-3-2-1', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['right', 'center', 'left'], positions: ['CM', 'DM', 'CM'] },
            { line: 'attacking_mid', lanes: ['center', 'center'], positions: ['AM', 'AM'] },
            { line: 'attack', lanes: ['center'], positions: ['ST'] }
        ] },
    '4-3-1-2': { name: '4-3-1-2', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['right', 'center', 'left'], positions: ['CM', 'DM', 'CM'] },
            { line: 'attacking_mid', lanes: ['center'], positions: ['AM'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '3-5-2': { name: '3-5-2', lines: [
            { line: 'defense', lanes: ['center', 'center', 'center'], positions: ['CB', 'CB', 'CB'] },
            { line: 'midfield', lanes: ['right', 'center', 'center', 'center', 'left'], positions: ['RB', 'CM', 'DM', 'CM', 'LB'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '3-1-4-2': { name: '3-1-4-2', lines: [
            { line: 'defense', lanes: ['center', 'center', 'center'], positions: ['CB', 'CB', 'CB'] },
            { line: 'midfield', lanes: ['center'], positions: ['DM'] },
            { line: 'midfield', lanes: ['right', 'center', 'center', 'left'], positions: ['RW', 'CM', 'CM', 'LW'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '3-2-3-2': { name: '3-2-3-2', lines: [
            { line: 'defense', lanes: ['center', 'center', 'center'], positions: ['CB', 'CB', 'CB'] },
            { line: 'midfield', lanes: ['center', 'center'], positions: ['DM', 'DM'] },
            { line: 'attacking_mid', lanes: ['right', 'center', 'left'], positions: ['RW', 'AM', 'LW'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '3-3-3-1': { name: '3-3-3-1', lines: [
            { line: 'defense', lanes: ['center', 'center', 'center'], positions: ['CB', 'CB', 'CB'] },
            { line: 'midfield', lanes: ['right', 'center', 'left'], positions: ['CM', 'DM', 'CM'] },
            { line: 'attacking_mid', lanes: ['right', 'center', 'left'], positions: ['RW', 'AM', 'LW'] },
            { line: 'attack', lanes: ['center'], positions: ['ST'] }
        ] },
    '3-4-3': { name: '3-4-3', lines: [
            { line: 'defense', lanes: ['center', 'center', 'center'], positions: ['CB', 'CB', 'CB'] },
            { line: 'midfield', lanes: ['right', 'center', 'center', 'left'], positions: ['RW', 'CM', 'CM', 'LW'] },
            { line: 'attack', lanes: ['right', 'center', 'left'], positions: ['RW', 'ST', 'LW'] }
        ] },
    '3-4-2-1': { name: '3-4-2-1', lines: [
            { line: 'defense', lanes: ['center', 'center', 'center'], positions: ['CB', 'CB', 'CB'] },
            { line: 'midfield', lanes: ['right', 'center', 'center', 'left'], positions: ['RW', 'CM', 'CM', 'LW'] },
            { line: 'attacking_mid', lanes: ['center', 'center'], positions: ['AM', 'AM'] },
            { line: 'attack', lanes: ['center'], positions: ['ST'] }
        ] },
    '3-4-1-2': { name: '3-4-1-2', lines: [
            { line: 'defense', lanes: ['center', 'center', 'center'], positions: ['CB', 'CB', 'CB'] },
            { line: 'midfield', lanes: ['right', 'center', 'center', 'left'], positions: ['RW', 'CM', 'CM', 'LW'] },
            { line: 'attacking_mid', lanes: ['center'], positions: ['AM'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '5-4-1': { name: '5-4-1', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['right', 'center', 'center', 'left'], positions: ['RW', 'CM', 'CM', 'LW'] },
            { line: 'attack', lanes: ['center'], positions: ['ST'] }
        ] },
    '5-3-2': { name: '5-3-2', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['right', 'center', 'left'], positions: ['CM', 'DM', 'CM'] },
            { line: 'attack', lanes: ['center', 'center'], positions: ['ST', 'ST'] }
        ] },
    '5-2-3': { name: '5-2-3', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['center', 'center'], positions: ['DM', 'DM'] },
            { line: 'attack', lanes: ['right', 'center', 'left'], positions: ['RW', 'ST', 'LW'] }
        ] },
    '5-5-0': { name: '5-5-0', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['right', 'center', 'center', 'center', 'left'], positions: ['RW', 'CM', 'DM', 'CM', 'LW'] }
        ] },
    '5-3-1-1': { name: '5-3-1-1', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['right', 'center', 'left'], positions: ['CM', 'DM', 'CM'] },
            { line: 'attacking_mid', lanes: ['center'], positions: ['AM'] },
            { line: 'attack', lanes: ['center'], positions: ['ST'] }
        ] },
    '5-2-2-1': { name: '5-2-2-1', lines: [
            { line: 'defense', lanes: ['right', 'center', 'center', 'center', 'left'], positions: ['RB', 'CB', 'CB', 'CB', 'LB'] },
            { line: 'midfield', lanes: ['center', 'center'], positions: ['DM', 'DM'] },
            { line: 'attacking_mid', lanes: ['center', 'center'], positions: ['AM', 'AM'] },
            { line: 'attack', lanes: ['center'], positions: ['ST'] }
        ] },
};
const LINE_ORDER = ['defense', 'midfield', 'attacking_mid', 'attack'];
const LANE_COL = { right: 0, center: 1, left: 2 };
function buildFormationSlots(formation) {
    const spec = exports.FORMATION_SPECS[formation];
    const slots = [{ position: 'GK', primaryZone: 1 }];
    let cur = -1;
    for (const ls of spec.lines) {
        const base = LINE_ORDER.indexOf(ls.line);
        const idx = Math.min(base > cur ? base : cur + 1, 3);
        cur = idx;
        for (let i = 0; i < ls.lanes.length; i++) {
            slots.push({ position: ls.positions[i], primaryZone: (idx * 3 + LANE_COL[ls.lanes[i]]) });
        }
    }
    return slots;
}
exports.TACTIC_EFFECTS = {
    possession: { zoneBonuses: { 4: 15, 7: 10, 1: 10 }, passBias: { 4: 1.5, 7: 1.3, 3: 1.1, 5: 1.1 }, pressZones: [4, 7] },
    counter: { zoneBonuses: { 9: 15, 11: 15, 10: 10 }, passBias: { 9: 1.5, 11: 1.5, 10: 1.3 }, pressZones: [1, 4] },
    high_press: { zoneBonuses: { 6: 10, 7: 10, 8: 10 }, passBias: { 6: 1.2, 7: 1.2, 8: 1.2 }, pressZones: [6, 7, 8, 9, 10, 11] },
    low_block: { zoneBonuses: { 0: 15, 1: 15, 2: 15 }, passBias: { 9: 1.4, 11: 1.4 }, pressZones: [0, 1, 2, 3, 4, 5] },
    wing_play: { zoneBonuses: { 3: 12, 5: 12, 6: 12, 8: 12, 9: 10, 11: 10 }, passBias: { 3: 1.4, 5: 1.4, 6: 1.3, 8: 1.3, 9: 1.5, 11: 1.5 }, pressZones: [3, 5, 6, 8] },
    direct: { zoneBonuses: { 10: 12, 9: 8, 11: 8 }, passBias: { 10: 1.6, 9: 1.3, 11: 1.3 }, pressZones: [4, 7] },
};
function zoneWeight(p, zone) {
    if (p.position === 'GK')
        return zone === 1 ? 1.0 : 0.0;
    return player_1.POSITION_ZONE_WEIGHTS[p.position]?.[zone] ?? 0;
}
function resolveLineup(team) {
    const slots = buildFormationSlots(team.formation);
    if (team.startingXI.length !== 11)
        throw new Error(`${team.name}: startingXI 11 olmalı, ${team.startingXI.length} verildi`);
    return team.startingXI.map((id, i) => {
        const player = team.players.find(p => p.id === id);
        if (!player)
            throw new Error(`${team.name}: oyuncu bulunamadı: ${id}`);
        return { player, slot: slots[i] };
    });
}
function calculateZonePowers(team) {
    const players = resolveLineup(team).map(l => l.player);
    const avgCond = players.reduce((s, p) => s + p.condition, 0) / players.length / 100;
    const avgMor = players.reduce((s, p) => s + p.morale, 0) / players.length / 100;
    const mod = (0.7 + 0.3 * avgCond) * (0.8 + 0.2 * avgMor);
    const powers = [];
    for (let z = 0; z < 12; z++) {
        const zone = z;
        let atk = 0, def = 0, ctl = 0;
        for (const p of players) {
            const w = zoneWeight(p, zone);
            if (w === 0)
                continue;
            const a = p.attributes;
            atk += w * (a.passing + a.dribbling + a.shooting + a.technique + a.vision + a.crossing) / 6;
            def += w * (a.tackling + a.marking + a.positioning + a.strength + a.heading) / 5;
            ctl += w * (a.technique + a.decisions + a.composure) / 3;
        }
        powers.push({ zone, attackPower: Math.round(atk * mod * 10) / 10, defensePower: Math.round(def * mod * 10) / 10, controlPower: Math.round(ctl * mod * 10) / 10 });
    }
    return powers;
}
function applyTacticModifiers(powers, tactics) {
    const mods = exports.TACTIC_EFFECTS[tactics.style];
    return powers.map(p => {
        const m = 1 + (mods.zoneBonuses[p.zone] ?? 0) / 100;
        return { zone: p.zone, attackPower: Math.round(p.attackPower * m * 10) / 10, defensePower: Math.round(p.defensePower * m * 10) / 10, controlPower: Math.round(p.controlPower * m * 10) / 10 };
    });
}
function pickBallCarrier(zone, lineup) {
    let best = null, bestScore = -1;
    for (const { player, slot } of lineup) {
        if (player.position === 'GK')
            continue;
        const baseW = zoneWeight(player, zone);
        const slotBonus = slot.primaryZone === zone ? 0.3 : 0;
        const w = baseW + slotBonus;
        if (w <= 0)
            continue;
        const score = w * ((player.attributes.positioning + player.attributes.decisions) / 2) * (player.condition / 100);
        if (score > bestScore) {
            bestScore = score;
            best = player;
        }
    }
    return best;
}
