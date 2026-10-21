import {
  MAP,
  START,
  type ApprovalGroup,
  type BuildingType,
  type FaithCommunity,
  type FoodItem,
} from '@giant/content';
import { computePrices } from './economy';
import { openAccount, type Account } from './money';

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  builtMonth: number;
  /** Set only on faith land grants. */
  faith?: FaithCommunity;
}

export interface GameState {
  /** In-game months elapsed since taking office. */
  month: number;
  /** Seeded RNG state; see Rng. */
  rng: number;
  treasury: Account;
  personal: Account;
  /** 0 to 100: how close the player is to being caught. */
  heat: number;
  buildings: Building[];
  nextBuildingId: number;
  /** 0 to 100 per group. */
  approval: Record<ApprovalGroup, number>;
  /** 0 to 100. */
  roadQuality: number;
  fuelPriceKobo: number;
  /** Current price of each basket item, in kobo. */
  prices: Record<FoodItem, number>;
}

export function createGame(seed: number): GameState {
  const buildings: Building[] = [
    { id: 1, type: 'ward_office', x: MAP.wardOffice.x, y: MAP.wardOffice.y, builtMonth: 0 },
  ];
  const roadQuality = START.roadQuality;
  const fuelPriceKobo = START.fuelPriceKobo;
  return {
    month: 0,
    rng: seed >>> 0,
    treasury: openAccount(START.treasuryKobo),
    personal: openAccount(START.personalKobo),
    heat: START.heat,
    buildings,
    nextBuildingId: 2,
    approval: { ...START.approval },
    roadQuality,
    fuelPriceKobo,
    prices: computePrices({ buildings, roadQuality, fuelPriceKobo }),
  };
}
