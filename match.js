"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateMatch = simulateMatch;
const core_1 = require("./core");
const rules_1 = require("./rules");
const chance_1 = require("./chance");
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function simulateMatch(home, away) {
    const H = (0, core_1.resolveLineup)(home), A = (0, core_1.resolveLineup)(away);
    for (const l of H) {
        l.player.condition = 95;
        l.player.morale = Math.min(100, l.player.morale + 5);
    }
    for (const l of A) {
        l.player.condition = 85;
    }
    const st = {
        minute: 0, zone: 4, possession: 'home',
        homeScore: 0, awayScore: 0, homeShots: 0, awayShots: 0,
        homePasses: 0, homePassesOk: 0, awayPasses: 0, awayPassesOk: 0, events: [],
    };
    for (let min = 1; min <= 90; min++) {
        st.minute = min;
        const isHome = st.possession === 'home';
        const atk = isHome ? H : A, def = isHome ? A : H;
        const actions = 1 + (0, chance_1.rng)(3);
        for (let a = 0; a < actions; a++) {
            const carrier = (0, core_1.pickBallCarrier)(st.zone, atk);
            if (!carrier) {
                st.zone = 4;
                continue;
            }
            const action = (0, rules_1.chooseAction)(carrier, st.zone);
            let result;
            if (action === 'shot') {
                result = (0, rules_1.resolveShot)(carrier, st.zone, def);
                isHome ? st.homeShots++ : st.awayShots++;
                if (result.goal) {
                    isHome ? st.homeScore++ : st.awayScore++;
                    st.events.push(`${min}' ${result.text}`);
                }
            }
            else if (action === 'cross') {
                result = (0, rules_1.resolveCross)(carrier, st.zone, def);
                isHome ? st.homePasses++ : st.awayPasses++;
                if (result.success)
                    isHome ? st.homePassesOk++ : st.awayPassesOk++;
            }
            else if (action === 'dribble') {
                result = (0, rules_1.resolveDribble)(carrier, st.zone, def);
            }
            else {
                const target = (0, rules_1.choosePassTarget)(st.zone, carrier);
                result = (0, rules_1.resolvePass)(carrier, target, def);
                isHome ? st.homePasses++ : st.awayPasses++;
                if (result.success)
                    isHome ? st.homePassesOk++ : st.awayPassesOk++;
            }
            st.zone = result.nextZone;
            if (result.possessionChange)
                st.possession = isHome ? 'away' : 'home';
        }
        for (const l of [...H, ...A])
            l.player.condition = clamp(l.player.condition - 0.15, 30, 100);
    }
    return st;
}
