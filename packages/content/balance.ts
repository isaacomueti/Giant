// Every balance number for the game lives here. Systems in @giant/sim read from
// this file and never hard-code tuning values. Money is integer kobo (₦1 = 100 kobo).

import type { ApprovalGroup, BuildingSpec, BuildingType, FoodItem } from './types';

/** Convert whole naira to kobo. Only use with integer naira. */
export const naira = (amount: number): number => amount * 100;

export const START = {
  /** Ward 7 treasury when the player takes office. */
  treasuryKobo: naira(25_000_000),
  /** The councillor's own savings on day one. */
  personalKobo: naira(1_500_000),
  heat: 0,
  approval: {
    youth: 45,
    traders: 50,
    transport: 40,
    families: 50,
    elites: 35,
  } satisfies Record<ApprovalGroup, number>,
  /** 0 to 100. Mushin roads start rough. */
  roadQuality: 40,
  /** Petrol pump price per litre. */
  fuelPriceKobo: naira(1_000),
} as const;

export const MONTHLY = {
  /** Monthly allocation from the Mushin local government to Ward 7. */
  wardAllocationKobo: naira(8_000_000),
  /** Ward office staff salaries, paid from the treasury. */
  staffSalariesKobo: naira(1_200_000),
  /** The councillor's salary and allowances, paid from the treasury. */
  councillorSalaryKobo: naira(450_000),
  /** Household costs the councillor pays from their own pocket. */
  livingCostsKobo: naira(250_000),
} as const;

export const HEAT = {
  min: 0,
  max: 100,
  /** Thresholds that emit an event when heat rises to or through them. */
  thresholds: [30, 50, 70, 90] as const,
  /** Heat that cools off on its own each month. */
  monthlyDecay: 2,
  /** Heat added for every ₦1m siphoned, rounded up. */
  perMillionNairaSiphoned: 3,
  /** Minimum heat added by any siphon, however small. */
  minSiphonHeat: 2,
} as const;

export type HeatThreshold = (typeof HEAT.thresholds)[number];

export const MAP = {
  /** Ward 7 is a square grid of this many tiles per side. */
  size: 24,
  /** Where the ward office stands on day one. */
  wardOffice: { x: 12, y: 12 },
} as const;

export const BUILDINGS: Record<BuildingType, BuildingSpec> = {
  ward_office: {
    name: 'Ward office',
    buildCostKobo: naira(20_000_000),
    upkeepKobo: naira(150_000),
    jobs: 8,
    unique: true,
    approval: { elites: 2 },
  },
  market: {
    name: 'Market',
    buildCostKobo: naira(15_000_000),
    upkeepKobo: naira(300_000),
    jobs: 120,
    levyKobo: naira(900_000),
    approval: { traders: 6, families: 2 },
    supplyRelief: { rice: 6, garri: 6, beans: 6, tomatoes: 8 },
  },
  primary_school: {
    name: 'Primary school',
    buildCostKobo: naira(12_000_000),
    upkeepKobo: naira(600_000),
    jobs: 25,
    approval: { families: 6, youth: 3 },
  },
  borehole: {
    name: 'Borehole',
    buildCostKobo: naira(3_000_000),
    upkeepKobo: naira(80_000),
    jobs: 2,
    approval: { families: 5, traders: 2 },
  },
  health_centre: {
    name: 'Primary health centre',
    buildCostKobo: naira(10_000_000),
    upkeepKobo: naira(700_000),
    jobs: 20,
    approval: { families: 6, transport: 1 },
  },
  motor_park: {
    name: 'Motor park',
    buildCostKobo: naira(8_000_000),
    upkeepKobo: naira(200_000),
    jobs: 60,
    levyKobo: naira(600_000),
    approval: { transport: 8, youth: 2 },
    supplyRelief: { transport_fare: 5 },
  },
  police_post: {
    name: 'Police post',
    buildCostKobo: naira(6_000_000),
    upkeepKobo: naira(400_000),
    jobs: 15,
    approval: { traders: 3, families: 3, elites: 2, youth: -1 },
  },
  drainage: {
    name: 'Drainage',
    buildCostKobo: naira(5_000_000),
    upkeepKobo: naira(100_000),
    jobs: 10,
    approval: { families: 1, transport: 1 },
    roadQuality: 15,
  },
  solar_streetlights: {
    name: 'Solar streetlights',
    buildCostKobo: naira(4_000_000),
    upkeepKobo: naira(50_000),
    jobs: 3,
    approval: { traders: 3, families: 2, youth: 2 },
  },
  faith_land_grant: {
    name: 'Faith land grant',
    buildCostKobo: naira(1_000_000),
    upkeepKobo: 0,
    jobs: 5,
    approval: { families: 4, elites: 1 },
  },
};

export const FAITH = {
  /**
   * When grants to one faith community outnumber the other by more than this,
   * every group's approval target drops: favouring one community lowers trust
   * across the board.
   */
  allowedImbalance: 1,
  /** Approval target points lost per grant beyond the allowed imbalance. */
  imbalancePenalty: 3,
} as const;

export const ROADS = {
  /** Road quality with no drainage. */
  baseQuality: 40,
  /** Road quality moves this fraction of the way to its target each month. */
  driftRate: 0.25,
} as const;

export const PRICES = {
  /** Baseline price of each basket item at base fuel price and road quality. */
  baseKobo: {
    rice: naira(6_500),
    garri: naira(3_000),
    beans: naira(5_500),
    tomatoes: naira(4_000),
    bread: naira(1_500),
    transport_fare: naira(600),
  } satisfies Record<FoodItem, number>,
  /** Monthly quantity of each item a typical Ward 7 household buys. */
  householdQuantity: {
    rice: 4,
    garri: 4,
    beans: 3,
    tomatoes: 4,
    bread: 20,
    transport_fare: 44,
  } satisfies Record<FoodItem, number>,
  /** Fuel price used as the baseline for price calculations. */
  baseFuelKobo: naira(1_000),
  /** Share of a fuel price change passed into each item's price. */
  fuelSensitivity: {
    rice: 0.2,
    garri: 0.2,
    beans: 0.2,
    tomatoes: 0.35,
    bread: 0.25,
    transport_fare: 0.6,
  } satisfies Record<FoodItem, number>,
  /** Road quality at which there is no road surcharge. */
  goodRoadQuality: 100,
  /** Price surcharge at road quality 0, as a fraction. Scales linearly. */
  roadSensitivity: {
    rice: 0.15,
    garri: 0.15,
    beans: 0.15,
    tomatoes: 0.3,
    bread: 0.1,
    transport_fare: 0.2,
  } satisfies Record<FoodItem, number>,
  /** Most supply relief an item can get, in percentage points. */
  maxSupplyRelief: 20,
  /** A month-on-month rise of at least this percentage emits a price spike event. */
  spikePercent: 10,
} as const;

export const APPROVAL = {
  min: 0,
  max: 100,
  /** Approval moves this fraction of the way to its target each month (at least 1 point). */
  driftRate: 0.25,
  /** Most approval target points the buildings can add for any one group. */
  maxBuildingBonus: 30,
  /** Every this many jobs in the ward adds a point to youth and families. */
  jobsPerPoint: 40,
  maxJobsBonus: 10,
  /**
   * Approval target points lost per 1% the household basket costs above
   * its value at baseline prices.
   */
  priceSensitivity: {
    youth: 0.3,
    traders: 0.3,
    transport: 0.4,
    families: 0.5,
    elites: 0.05,
  } satisfies Record<ApprovalGroup, number>,
} as const;
