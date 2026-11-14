"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skill = skill;
exports.findDefender = findDefender;
exports.resolvePass = resolvePass;
exports.resolveShot = resolveShot;
exports.resolveDribble = resolveDribble;
exports.resolveCross = resolveCross;
exports.chooseAction = chooseAction;
exports.choosePassTarget = choosePassTarget;
const pitch_1 = require("./pitch");
const core_1 = require("./core");
const chance_1 = require("./chance");
function skill(p, attr) {
    return p.attributes[attr] * (0.6 + 0.4 * p.condition / 100);
}
function findDefender(target, oppLineup) {
    const mirror = pitch_1.PITCH_ZONES[target].mirrorZone;
    return (0, core_1.pickBallCarrier)(mirror, oppLineup) ?? (0, core_1.pickBallCarrier)(target, oppLineup);
}
function resolvePass(carrier, target, oppLineup) {
    const defender = findDefender(target, oppLineup);
    const passVal = skill(carrier, 'passing');
    const defVal = defender ? skill(defender, 'tackling') * 0.35 : 4;
    const ok = (0, chance_1.roll)(passVal, defVal, 0.15);
    return {
        success: ok,
        nextZone: target,
        possessionChange: !ok,
        text: ok ? `${carrier.name} → Zone ${target} pası` : `${carrier.name} pası kesildi`,
    };
}
function resolveShot(carrier, zone, oppLineup) {
    const gk = oppLineup.find(l => l.player.position === 'GK')?.player;
    const gkVal = gk ? (gk.attributes.goalkeeping * 0.7 + gk.attributes.reflexes * 0.3) : 8;
    const dist = zone === 10 ? 1.0 : (zone === 9 || zone === 11 ? 0.80 : 0.55);
    const shotPower = skill(carrier, 'shooting') * dist;
    const onTarget = (0, chance_1.roll)(shotPower, 10, 0.25);
    const goalProb = Math.max(0.07, Math.min(0.38, (shotPower / (gkVal * 2)) * 0.42));
    const isGoal = onTarget && Math.random() < goalProb;
    return {
        success: isGoal,
        nextZone: 4,
        possessionChange: true,
        goal: isGoal,
        text: isGoal ? `⚽ GOL! ${carrier.name} (Zone ${zone})` : onTarget ? `🧤 Kaleci kurtardı: ${carrier.name}` : `❌ Şut kaçtı: ${carrier.name}`,
    };
}
function resolveDribble(carrier, zone, oppLineup) {
    const defender = findDefender(zone, oppLineup);
    const ok = (0, chance_1.roll)(skill(carrier, 'dribbling'), defender ? skill(defender, 'marking') : 5, 0.2);
    const nextZone = ok ? Math.min(11, zone + 3) : zone;
    return {
        success: ok,
        nextZone,
        possessionChange: !ok,
        text: ok ? `${carrier.name} adam geçti → Zone ${nextZone}` : `${carrier.name} topu kaybetti`,
    };
}
function resolveCross(carrier, zone, oppLineup) {
    const def = findDefender(10, oppLineup);
    const ok = (0, chance_1.roll)(skill(carrier, 'crossing'), def ? skill(def, 'heading') * 0.7 : 4, 0.15);
    return {
        success: ok,
        nextZone: 10,
        possessionChange: !ok,
        text: ok ? `${carrier.name} orta → ceza sahası` : `${carrier.name} ortası kesildi`,
    };
}
function chooseAction(carrier, zone) {
    if (zone === 10 && (0, chance_1.chance)(0.55))
        return 'shot';
    if ((zone === 9 || zone === 11) && (0, chance_1.chance)(0.25))
        return 'cross';
    if (zone >= 6 && zone <= 8 && (0, chance_1.chance)(0.14))
        return 'shot';
    if (skill(carrier, 'dribbling') > 14 && (0, chance_1.chance)(0.12))
        return 'dribble';
    return 'pass';
}
function choosePassTarget(zone, carrier) {
    const neighbors = pitch_1.ZONE_NEIGHBORS[zone];
    const forward = neighbors.filter(z => z > zone);
    const backward = neighbors.filter(z => z < zone);
    if (skill(carrier, 'longPassing') > 14 && (0, chance_1.chance)(0.25))
        return (0, chance_1.pick)(neighbors);
    if (forward.length > 0 && (0, chance_1.chance)(0.70))
        return (0, chance_1.pick)(forward);
    if (backward.length > 0 && (0, chance_1.chance)(0.10))
        return (0, chance_1.pick)(backward);
    return (0, chance_1.pick)(neighbors);
}
