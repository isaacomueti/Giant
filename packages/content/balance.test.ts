import { describe, expect, it } from 'vitest';
import { BUILDINGS, HEAT, MONTHLY, PRICES, START, naira } from './balance';
import { APPROVAL_GROUPS, BUILDING_TYPES, FOOD_ITEMS } from './types';

describe('balance', () => {
  it('converts naira to integer kobo', () => {
    expect(naira(1)).toBe(100);
    expect(naira(2_500_000)).toBe(250_000_000);
  });

  it('keeps every money value in integer kobo', () => {
    const money = [
      START.treasuryKobo,
      START.personalKobo,
      START.fuelPriceKobo,
      ...Object.values(MONTHLY),
      ...Object.values(PRICES.baseKobo),
      PRICES.baseFuelKobo,
      ...Object.values(BUILDINGS).flatMap((b) => [b.buildCostKobo, b.upkeepKobo, b.levyKobo ?? 0]),
    ];
    for (const value of money) expect(Number.isSafeInteger(value)).toBe(true);
  });

  it('defines all ten building types', () => {
    expect(BUILDING_TYPES).toHaveLength(10);
    expect(Object.keys(BUILDINGS).sort()).toEqual([...BUILDING_TYPES].sort());
  });

  it('prices every basket item', () => {
    for (const item of FOOD_ITEMS) {
      expect(PRICES.baseKobo[item]).toBeGreaterThan(0);
      expect(PRICES.householdQuantity[item]).toBeGreaterThan(0);
    }
  });

  it('starts every approval group inside 0 to 100', () => {
    for (const group of APPROVAL_GROUPS) {
      expect(START.approval[group]).toBeGreaterThanOrEqual(0);
      expect(START.approval[group]).toBeLessThanOrEqual(100);
    }
  });

  it('lists heat thresholds in rising order inside the meter', () => {
    const sorted = [...HEAT.thresholds].sort((a, b) => a - b);
    expect(HEAT.thresholds).toEqual(sorted);
    expect(HEAT.thresholds.every((t) => t > HEAT.min && t < HEAT.max)).toBe(true);
  });
});
