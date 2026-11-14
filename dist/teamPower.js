"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEAM_POWERS = void 0;
const RAW = {
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
    kar: { last: 0, current: 30, value: 22 },
};
function computePower(last, current, value) {
    let ptsPower;
    if (last > 0) {
        // Normal takım: %50 geçen + %50 güncel (tam sezon verisi güvenilir)
        const lastPerMatch = last / 36;
        const currentPerMatch = current / 34;
        ptsPower = (lastPerMatch * 0.5 + currentPerMatch * 0.5) / 2.8;
    }
    else {
        // Yeni takım: sadece güncel + %10 ceza
        ptsPower = (current / 34) / 2.8 * 0.9;
    }
    const valuePower = Math.min(1, value / 337);
    // %85 puan + %15 değer (puan daha önemli)
    return Math.min(1, ptsPower * 0.85 + valuePower * 0.15);
}
exports.TEAM_POWERS = {};
for (const [id, data] of Object.entries(RAW)) {
    const power = computePower(data.last, data.current, data.value);
    exports.TEAM_POWERS[id] = {
        id,
        name: id.toUpperCase(),
        power: Math.round(power * 1000) / 1000,
        attackStrength: Math.round(power * 100) / 100,
        defenseStrength: Math.round((power * 0.9 + 0.1) * 100) / 100,
        lastSeasonPts: data.last,
        currentPts: data.current,
        squadValue: data.value,
    };
}
