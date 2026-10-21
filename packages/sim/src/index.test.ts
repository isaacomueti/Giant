import { describe, expect, it } from 'vitest';
import { SIM_VERSION } from './index';

describe('sim', () => {
  it('exports a version', () => {
    expect(SIM_VERSION).toBe(0);
  });
});
