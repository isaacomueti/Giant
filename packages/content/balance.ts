// Every balance number for the game lives here. Systems in @giant/sim read from
// this file and never hard-code tuning values. Money is integer kobo (₦1 = 100 kobo).

/** Convert whole naira to kobo. Only use with integer naira. */
export const naira = (amount: number): number => amount * 100;

export const START = {
  /** Ward 7 treasury when the player takes office. */
  treasuryKobo: naira(25_000_000),
  /** The councillor's own savings on day one. */
  personalKobo: naira(1_500_000),
  heat: 0,
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
