"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ===== bundle.ts =====
const squads_1 = require("./squads");
const predict_1 = require("./predict");
window.FM = { TEAMS: squads_1.TEAMS, predictMatch: predict_1.predictMatch, setLineup: predict_1.setLineup, setTactics: predict_1.setTactics };
