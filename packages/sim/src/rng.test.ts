import { describe, expect, it } from 'vitest';
import { Rng } from './rng';

describe('Rng', () => {
  it('produces the same sequence from the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('produces different sequences from different seeds', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });

  it('resumes exactly from its stored state', () => {
    const a = new Rng(7);
    a.next();
    const resumed = new Rng(a.state);
    expect(resumed.next()).toBe(a.next());
  });

  it('keeps ints within the inclusive range', () => {
    const rng = new Rng(9);
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(3, 6);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
    }
  });
});
