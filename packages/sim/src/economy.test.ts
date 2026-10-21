import { BUILDINGS, FOOD_ITEMS, PRICES, START, type BuildingType } from '@giant/content';
import { describe, expect, it } from 'vitest';
import {
  REFERENCE_BASKET_KOBO,
  basketCost,
  computePrices,
  driftToward,
  roadQualityTarget,
  supplyRelief,
} from './economy';
import type { Building } from './state';

const at = (type: BuildingType, id = 1): Building => ({ id, type, x: id, y: 0, builtMonth: 0 });
const base = { buildings: [], roadQuality: START.roadQuality, fuelPriceKobo: START.fuelPriceKobo };

describe('prices', () => {
  it('are integer kobo', () => {
    const prices = computePrices({ ...base, fuelPriceKobo: 133_337 });
    for (const item of FOOD_ITEMS) expect(Number.isSafeInteger(prices[item])).toBe(true);
  });

  it('match the base price at base fuel and perfect roads with no supply relief', () => {
    expect(computePrices({ ...base, roadQuality: PRICES.goodRoadQuality })).toEqual(
      PRICES.baseKobo,
    );
  });

  it('rise with the fuel price, transport fare most of all', () => {
    const normal = computePrices(base);
    const dear = computePrices({ ...base, fuelPriceKobo: PRICES.baseFuelKobo * 2 });
    for (const item of FOOD_ITEMS) expect(dear[item]).toBeGreaterThan(normal[item]);
    const rise = (item: (typeof FOOD_ITEMS)[number]) => dear[item] / normal[item];
    expect(rise('transport_fare')).toBeGreaterThan(rise('rice'));
  });

  it('fall as road quality improves', () => {
    const bad = computePrices({ ...base, roadQuality: 10 });
    const good = computePrices({ ...base, roadQuality: 90 });
    for (const item of FOOD_ITEMS) expect(good[item]).toBeLessThan(bad[item]);
  });

  it('fall when a market adds supply, but not for items it does not stock', () => {
    const withMarket = computePrices({ ...base, buildings: [at('market')] });
    const without = computePrices(base);
    expect(withMarket.tomatoes).toBeLessThan(without.tomatoes);
    expect(withMarket.rice).toBeLessThan(without.rice);
    expect(withMarket.bread).toBe(without.bread);
  });

  it('give cheaper fares with a motor park', () => {
    const withPark = computePrices({ ...base, buildings: [at('motor_park')] });
    expect(withPark.transport_fare).toBeLessThan(computePrices(base).transport_fare);
  });

  it('cap supply relief', () => {
    const markets = Array.from({ length: 10 }, (_, i) => at('market', i + 1));
    expect(supplyRelief(markets).tomatoes).toBe(PRICES.maxSupplyRelief);
  });

  it('give the reference basket at starting conditions', () => {
    expect(basketCost(computePrices(base))).toBe(REFERENCE_BASKET_KOBO);
  });
});

describe('roads', () => {
  it('target better quality with drainage, capped at 100', () => {
    expect(roadQualityTarget([at('drainage')])).toBe(
      roadQualityTarget([]) + (BUILDINGS.drainage.roadQuality ?? 0),
    );
    const lots = Array.from({ length: 20 }, (_, i) => at('drainage', i + 1));
    expect(roadQualityTarget(lots)).toBe(100);
  });

  it('drift toward their target and settle on it', () => {
    expect(driftToward(40, 55, 0.25)).toBe(44);
    expect(driftToward(54, 55, 0.25)).toBe(55);
    expect(driftToward(55, 55, 0.25)).toBe(55);
    expect(driftToward(55, 40, 0.25)).toBe(51);
  });
});
