"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// ===== app.ts =====
const readline = __importStar(require("readline"));
const predict_1 = require("./predict");
const squads_1 = require("./squads");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (query) => new Promise((resolve) => rl.question(query, resolve));
// 4-2-3-1 ilk 11 sırası
const POSITIONS = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'DM', 'RW', 'AM', 'LW', 'ST'];
async function selectTeam(prompt, excludeId) {
    const ids = Object.keys(squads_1.TEAMS).filter(id => id !== excludeId);
    console.log(`\n${prompt}`);
    ids.forEach((id, i) => console.log(`  ${String(i + 1).padStart(2)}. ${squads_1.TEAMS[id].name}`));
    while (true) {
        const ans = await ask('Takım numarası: ');
        const idx = parseInt(ans) - 1;
        if (idx >= 0 && idx < ids.length)
            return ids[idx];
        console.log('❌ Geçersiz seçim, tekrar dene.');
    }
}
async function selectLineup(team) {
    console.log(`\n=== ${team.name} — İLK 11 SEÇİMİ ===`);
    const xi = [];
    const usedIds = new Set();
    for (let i = 0; i < 11; i++) {
        const currentId = team.startingXI[i];
        const currentPlayer = team.players.find(p => p.id === currentId);
        console.log(`\n[${i + 1}/11] Mevki: ${POSITIONS[i]} — Şu anki: ${currentPlayer?.name || 'Boş'}`);
        // Bu mevkide oynayabilen oyuncular önce, sonra tüm kadro
        const exact = team.players.filter(p => p.position === POSITIONS[i] && !usedIds.has(p.id));
        const others = team.players.filter(p => p.position !== POSITIONS[i] && !usedIds.has(p.id));
        console.log('  Uygun oyuncular:');
        exact.forEach((p, j) => console.log(`    ${j + 1}. ${p.name} (${p.position})`));
        console.log('  Diğer oyuncular:');
        others.forEach((p, j) => console.log(`    ${exact.length + j + 1}. ${p.name} (${p.position})`));
        const all = [...exact, ...others];
        while (true) {
            const ans = await ask('Seç (boş = mevcut): ');
            if (ans.trim() === '') {
                xi.push(currentId);
                usedIds.add(currentId);
                break;
            }
            const idx = parseInt(ans) - 1;
            if (idx >= 0 && idx < all.length) {
                xi.push(all[idx].id);
                usedIds.add(all[idx].id);
                break;
            }
            console.log('❌ Geçersiz, tekrar dene.');
        }
    }
    team.startingXI = xi;
    console.log(`\n✅ ${team.name} ilk 11 güncellendi.`);
}
async function selectTactics(team) {
    console.log(`\n=== ${team.name} — TAKTİK ===`);
    const styles = ['possession', 'counter', 'high_press', 'low_block', 'wing_play', 'direct'];
    console.log('Mevcut stil:', team.tactics.style);
    styles.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    const ans = await ask('Stil seç (boş = mevcut): ');
    const idx = parseInt(ans) - 1;
    if (idx >= 0 && idx < styles.length)
        team.tactics.style = styles[idx];
    console.log(`✅ ${team.name} taktiği: ${team.tactics.style}`);
}
async function main() {
    console.log('⚽ FM27 — Süper Lig Maç Simülatörü ⚽');
    console.log(`Toplam ${Object.keys(squads_1.TEAMS).length} takım mevcut.\n`);
    const homeId = await selectTeam('EV SAHİBİ takım seç:');
    const awayId = await selectTeam('DEPLASMAN takım seç:', homeId);
    const home = squads_1.TEAMS[homeId];
    const away = squads_1.TEAMS[awayId];
    console.log(`\n📅 ${home.name} vs ${away.name}`);
    await selectLineup(home);
    await selectLineup(away);
    await selectTactics(home);
    await selectTactics(away);
    console.log('\n⏳ 10.000 kez simüle ediliyor...\n');
    const t0 = Date.now();
    const p = (0, predict_1.predictMatch)(home, away, 10000);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`=== TAHMİN (${elapsed}s) ===\n`);
    console.log(`${home.name} Kazanır: %${p.homeWinPct} (Oran: ${p.odds.home})`);
    console.log(`Beraberlik:        %${p.drawPct} (Oran: ${p.odds.draw})`);
    console.log(`${away.name} Kazanır: %${p.awayWinPct} (Oran: ${p.odds.away})`);
    console.log(`\n2.5 Üst: %${p.over25Pct} (Oran: ${p.odds.over25})`);
    console.log(`2.5 Alt: %${p.under25Pct} (Oran: ${p.odds.under25})`);
    console.log(`KG Var:  %${p.bttsPct} (Oran: ${p.odds.bttsYes})`);
    console.log(`\nEn Olası Skor: ${p.mostLikelyScore} · Ortalama Gol: ${p.avgGoals}`);
    console.log('\nEn Sık Skorlar:');
    Object.entries(p.scoreDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .forEach(([score, pct]) => console.log(`  ${score}: %${pct}`));
    rl.close();
}
main();
