import { BUILDINGS, FOOD_ITEMS, PRICES, ROADS, START, type FoodItem } from '@giant/content';
import type { Building } from './state';

export interface PriceInputs {
  buildings: readonly Building[];
  roadQuality: number;
  fuelPriceKobo: number;
}

/** Percentage points of supply relief each item gets from the ward's buildings. */
export function supplyRelief(buildings: readonly Building[]): Record<FoodItem, number> {
  const relief = Object.fromEntries(FOOD_ITEMS.map((item) => [item, 0])) as Record<
    FoodItem,
    number
  >;
  for (const b of buildings) {
    for (const [item, points] of Object.entries(BUILDINGS[b.type].supplyRelief ?? {})) {
      relief[item as FoodItem] += points;
    }
  }
  for (const item of FOOD_ITEMS) relief[item] = Math.min(PRICES.maxSupplyRelief, relief[item]);
  return relief;
}

/** Price of every basket item in integer kobo, from supply, roads and fuel. */
export function computePrices(inputs: PriceInputs): Record<FoodItem, number> {
  const relief = supplyRelief(inputs.buildings);
  const fuelChange = inputs.fuelPriceKobo / PRICES.baseFuelKobo - 1;
  const roadGap = Math.max(0, PRICES.goodRoadQuality - inputs.roadQuality) / PRICES.goodRoadQuality;
  const prices = {} as Record<FoodItem, number>;
  for (const item of FOOD_ITEMS) {
    const factor =
      (1 + PRICES.fuelSensitivity[item] * fuelChange) *
      (1 + PRICES.roadSensitivity[item] * roadGap) *
      (1 - relief[item] / 100);
    prices[item] = Math.max(1, Math.round(PRICES.baseKobo[item] * factor));
  }
  return prices;
}

/** Monthly cost of the typical household basket, in kobo. */
export function basketCost(prices: Record<FoodItem, number>): number {
  return FOOD_ITEMS.reduce((sum, item) => sum + prices[item] * PRICES.householdQuantity[item], 0);
}

/** The basket on the day the player took office; approval is judged against it. */
export const REFERENCE_BASKET_KOBO = basketCost(
  computePrices({
    buildings: [],
    roadQuality: START.roadQuality,
    fuelPriceKobo: START.fuelPriceKobo,
  }),
);

/** Road quality the ward drifts toward, given its drainage. */
export function roadQualityTarget(buildings: readonly Building[]): number {
  const bonus = buildings.reduce((sum, b) => sum + (BUILDINGS[b.type].roadQuality ?? 0), 0);
  return Math.min(100, ROADS.baseQuality + bonus);
}

export function driftToward(current: number, target: number, rate: number): number {
  if (current === target) return current;
  const step = Math.round((target - current) * rate);
  if (step !== 0) return current + step;
  return current + Math.sign(target - current);
}
