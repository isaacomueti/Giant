import { describe, expect, it } from 'vitest';
import { naira } from './balance';

describe('naira', () => {
  it('converts naira to integer kobo', () => {
    expect(naira(1)).toBe(100);
    expect(Number.isInteger(naira(2_500_000))).toBe(true);
  });
});
