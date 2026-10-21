import { START } from '@giant/content';
import { openAccount, type Account } from './money';

export interface GameState {
  /** In-game months elapsed since taking office. */
  month: number;
  /** Seeded RNG state; see Rng. */
  rng: number;
  treasury: Account;
  personal: Account;
  /** 0 to 100: how close the player is to being caught. */
  heat: number;
}

export function createGame(seed: number): GameState {
  return {
    month: 0,
    rng: seed >>> 0,
    treasury: openAccount(START.treasuryKobo),
    personal: openAccount(START.personalKobo),
    heat: START.heat,
  };
}
