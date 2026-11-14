import { TEAMS } from './squads';
import { predictMatch, setLineup, setTactics } from './predict';

export interface FMApi {
  TEAMS: typeof TEAMS;
  predictMatch: typeof predictMatch;
  setLineup: typeof setLineup;
  setTactics: typeof setTactics;
}

declare global {
  interface Window {
    FM?: FMApi;
  }
}

if (typeof window !== 'undefined') {
  window.FM = {
    TEAMS,
    predictMatch,
    setLineup,
    setTactics
  };
}
