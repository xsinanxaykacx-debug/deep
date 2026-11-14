"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictMatch = predictMatch;
exports.setLineup = setLineup;
exports.setTactics = setTactics;
// ===== predict.ts =====
const squads_1 = require("./squads");
const match_1 = require("./match");
function predictMatch(home, away, sims = 10000) {
    const H = typeof home === 'string' ? squads_1.TEAMS[home] : home;
    const A = typeof away === 'string' ? squads_1.TEAMS[away] : away;
    if (!H)
        throw new Error(`Ev sahibi takım bulunamadı: ${home}`);
    if (!A)
        throw new Error(`Deplasman takımı bulunamadı: ${away}`);
    let hw = 0, dr = 0, aw = 0, tg = 0, o25 = 0, btts = 0;
    const scores = {};
    for (let i = 0; i < sims; i++) {
        const r = (0, match_1.simulateMatch)(H, A);
        if (r.homeScore > r.awayScore)
            hw++;
        else if (r.homeScore < r.awayScore)
            aw++;
        else
            dr++;
        tg += r.homeScore + r.awayScore;
        if (r.homeScore + r.awayScore > 2.5)
            o25++;
        if (r.homeScore > 0 && r.awayScore > 0)
            btts++;
        const k = `${r.homeScore}-${r.awayScore}`;
        scores[k] = (scores[k] || 0) + 1;
    }
    let mls = '1-1', mc = 0;
    for (const [s, c] of Object.entries(scores))
        if (c > mc) {
            mc = c;
            mls = s;
        }
    const hwp = (hw / sims) * 100, dp = (dr / sims) * 100, awp = (aw / sims) * 100;
    const o25p = (o25 / sims) * 100, bt = (btts / sims) * 100;
    const m = 1.05;
    return {
        homeWinPct: Math.round(hwp * 10) / 10, drawPct: Math.round(dp * 10) / 10, awayWinPct: Math.round(awp * 10) / 10,
        avgGoals: Math.round((tg / sims) * 100) / 100,
        over25Pct: Math.round(o25p * 10) / 10, under25Pct: Math.round((100 - o25p) * 10) / 10, bttsPct: Math.round(bt * 10) / 10,
        mostLikelyScore: mls,
        scoreDistribution: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Math.round((v / sims) * 1000) / 10])),
        odds: {
            home: Math.round((100 / hwp) * m * 100) / 100,
            draw: Math.round((100 / dp) * m * 100) / 100,
            away: Math.round((100 / awp) * m * 100) / 100,
            over25: Math.round((100 / o25p) * m * 100) / 100,
            under25: Math.round((100 / (100 - o25p)) * m * 100) / 100,
            bttsYes: Math.round((100 / bt) * m * 100) / 100,
        },
    };
}
function setLineup(teamId, startingXI, bench) {
    const t = squads_1.TEAMS[teamId];
    if (!t)
        throw new Error(`Takım yok: ${teamId}`);
    if (startingXI.length !== 11)
        throw new Error('İlk 11, 11 oyuncu olmalı');
    for (const id of startingXI)
        if (!t.players.find(p => p.id === id))
            throw new Error(`Oyuncu yok: ${id}`);
    t.startingXI = startingXI;
    t.bench = bench;
}
function setTactics(teamId, style, width, depth, pressing, tempo, passingRange) {
    const t = squads_1.TEAMS[teamId];
    if (!t)
        throw new Error(`Takım yok: ${teamId}`);
    t.tactics = { style: style, width, depth, pressing, tempo, passingRange };
}
