"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
exports.rand = rand;
exports.rng = rng;
exports.pick = pick;
exports.chance = chance;
exports.roll = roll;
// ===== chance.ts =====
let _seed = Date.now() % 2147483647;
function seed(n) { _seed = n % 2147483647 || 1; }
function rand() {
    _seed = (_seed * 16807) % 2147483647;
    return (_seed - 1) / 2147483646;
}
function rng(max) { return Math.floor(rand() * max); }
function pick(arr) { return arr[rng(arr.length)]; }
function chance(p) { return rand() < p; }
function roll(attack, defense, floor = 0.15) {
    const diff = attack - defense;
    const prob = 0.5 + diff * 0.04;
    return rand() < Math.max(floor, Math.min(1 - floor, prob));
}
