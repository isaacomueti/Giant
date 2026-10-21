import { describe, expect, it } from 'vitest';
import { formatNaira, formatNairaShort } from './money';

describe('formatNaira', () => {
  it('shows naira with thousands separators', () => {
    expect(formatNaira(2_500_000_000)).toBe('₦25,000,000');
    expect(formatNaira(0)).toBe('₦0');
  });

  it('shows leftover kobo', () => {
    expect(formatNaira(123_456)).toBe('₦1,234.56');
    expect(formatNaira(105)).toBe('₦1.05');
  });

  it('handles negatives', () => {
    expect(formatNaira(-150_000)).toBe('-₦1,500');
  });
});

describe('formatNairaShort', () => {
  it('abbreviates', () => {
    expect(formatNairaShort(1_500_000_000)).toBe('₦15m');
    expect(formatNairaShort(45_000_000)).toBe('₦450k');
    expect(formatNairaShort(250_000_000)).toBe('₦2.5m');
    expect(formatNairaShort(80_000)).toBe('₦800');
    expect(formatNairaShort(-300_000_000_000)).toBe('-₦3bn');
  });
});
