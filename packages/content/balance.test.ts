import { describe, expect, it } from 'vitest';
import { HEAT, MONTHLY, START, naira } from './balance';

describe('balance', () => {
  it('converts naira to integer kobo', () => {
    expect(naira(1)).toBe(100);
    expect(naira(2_500_000)).toBe(250_000_000);
  });

  it('keeps every money value in integer kobo', () => {
    for (const value of [...Object.values(START), ...Object.values(MONTHLY)]) {
      expect(Number.isSafeInteger(value)).toBe(true);
    }
  });

  it('lists heat thresholds in rising order inside the meter', () => {
    const sorted = [...HEAT.thresholds].sort((a, b) => a - b);
    expect(HEAT.thresholds).toEqual(sorted);
    expect(HEAT.thresholds.every((t) => t > HEAT.min && t < HEAT.max)).toBe(true);
  });
});
