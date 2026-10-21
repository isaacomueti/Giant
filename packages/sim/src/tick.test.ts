import { HEAT, MONTHLY, START } from '@giant/content';
import { describe, expect, it } from 'vitest';
import type { Action } from './actions';
import { siphonHeat } from './heat';
import { isBalanced } from './money';
import { createGame, type GameState } from './state';
import { tick } from './tick';

const MILLION = 100 * 1_000_000; // ₦1m in kobo

function run(seed: number, script: Action[][]) {
  let state = createGame(seed);
  const allEvents = [];
  for (const actions of script) {
    const result = tick(state, actions);
    state = result.state;
    allEvents.push(result.events);
  }
  return { state, events: allEvents };
}

function allLedgerAmounts(state: GameState): number[] {
  return [...state.treasury.ledger, ...state.personal.ledger].map((e) => e.amountKobo);
}

describe('tick determinism', () => {
  const script: Action[][] = [
    [],
    [{ type: 'siphon', amountKobo: 3 * MILLION }],
    [],
    [{ type: 'siphon', amountKobo: 1_234_567 }],
  ];

  it('gives the same result for the same seed and actions', () => {
    expect(run(2026, script)).toEqual(run(2026, script));
  });

  it('serialises and resumes identically', () => {
    const half = run(5, script.slice(0, 2)).state;
    const resumed = JSON.parse(JSON.stringify(half)) as GameState;
    let a = half;
    let b = resumed;
    for (const actions of script.slice(2)) {
      a = tick(a, actions).state;
      b = tick(b, actions).state;
    }
    expect(b).toEqual(a);
  });

  it('does not mutate the input state', () => {
    const state = createGame(1);
    const snapshot = JSON.parse(JSON.stringify(state)) as GameState;
    tick(state, [{ type: 'siphon', amountKobo: MILLION }]);
    expect(state).toEqual(snapshot);
  });

  it('advances the month by one', () => {
    const { state } = run(1, [[], [], []]);
    expect(state.month).toBe(3);
  });
});

describe('money integrity', () => {
  it('keeps every ledger entry and balance in integer kobo', () => {
    const { state } = run(3, [[{ type: 'siphon', amountKobo: 777 }], [], []]);
    for (const amount of allLedgerAmounts(state)) expect(Number.isSafeInteger(amount)).toBe(true);
    expect(Number.isSafeInteger(state.treasury.balanceKobo)).toBe(true);
    expect(Number.isSafeInteger(state.personal.balanceKobo)).toBe(true);
  });

  it('keeps both ledgers balanced against their opening balances', () => {
    const { state } = run(3, [[{ type: 'siphon', amountKobo: 2 * MILLION }], [], []]);
    expect(isBalanced(state.treasury)).toBe(true);
    expect(isBalanced(state.personal)).toBe(true);
  });

  it('applies the monthly flows', () => {
    const { state } = run(1, [[]]);
    expect(state.treasury.balanceKobo).toBe(
      START.treasuryKobo +
        MONTHLY.wardAllocationKobo -
        MONTHLY.staffSalariesKobo -
        MONTHLY.councillorSalaryKobo,
    );
    expect(state.personal.balanceKobo).toBe(
      START.personalKobo + MONTHLY.councillorSalaryKobo - MONTHLY.livingCostsKobo,
    );
  });

  it('moves siphoned money without creating or destroying any', () => {
    const before = createGame(1);
    const after = tick(before, [{ type: 'siphon', amountKobo: 4 * MILLION }]).state;
    const plain = tick(before, []).state;
    expect(after.treasury.balanceKobo).toBe(plain.treasury.balanceKobo - 4 * MILLION);
    expect(after.personal.balanceKobo).toBe(plain.personal.balanceKobo + 4 * MILLION);
  });

  it.each([0, -5, 1.5, Number.NaN])('rejects a siphon of %s', (amountKobo) => {
    const { state, events } = tick(createGame(1), [{ type: 'siphon', amountKobo }]);
    expect(events.some((e) => e.type === 'action_rejected')).toBe(true);
    expect(state.heat).toBe(0);
    expect(isBalanced(state.treasury)).toBe(true);
  });

  it('rejects a siphon larger than the treasury', () => {
    const { state, events } = tick(createGame(1), [
      { type: 'siphon', amountKobo: START.treasuryKobo + 1 },
    ]);
    expect(events.some((e) => e.type === 'action_rejected')).toBe(true);
    expect(state.treasury.ledger.some((e) => e.category === 'siphon')).toBe(false);
  });
});

describe('heat', () => {
  it('never lets a siphon go free', () => {
    const { state } = tick(createGame(1), [{ type: 'siphon', amountKobo: 1 }]);
    expect(state.heat).toBe(Math.max(0, HEAT.minSiphonHeat - HEAT.monthlyDecay));
    expect(siphonHeat(1)).toBeGreaterThan(0);
  });

  it('cools off over time but never below zero', () => {
    const start = { ...createGame(1), heat: 5 };
    let state = start;
    for (let i = 0; i < 10; i++) state = tick(state, []).state;
    expect(state.heat).toBe(0);
  });

  it('emits each threshold once as heat climbs through it', () => {
    // ₦10m adds 30 heat at the default rate.
    const { events } = tick(createGame(1), [{ type: 'siphon', amountKobo: 10 * MILLION }]);
    const thresholds = events.flatMap((e) => (e.type === 'heat_threshold' ? [e.threshold] : []));
    expect(thresholds).toEqual([30]);
  });

  it('emits every threshold crossed in one month, lowest first', () => {
    const state = createGame(1);
    const { events, state: after } = tick(state, [{ type: 'siphon', amountKobo: 24 * MILLION }]);
    const thresholds = events.flatMap((e) => (e.type === 'heat_threshold' ? [e.threshold] : []));
    expect(thresholds).toEqual([30, 50, 70]);
    expect(after.heat).toBe(72 - HEAT.monthlyDecay);
  });

  it('caps heat at 100 and reports 90 on the way', () => {
    const rich = { ...createGame(1), heat: 85 };
    const { events, state } = tick(rich, [{ type: 'siphon', amountKobo: 20 * MILLION }]);
    expect(events).toContainEqual({ type: 'heat_threshold', threshold: 90, heat: 100 });
    expect(state.heat).toBe(100 - HEAT.monthlyDecay);
  });

  it('does not re-emit a threshold while heat stays above it', () => {
    const hot = { ...createGame(1), heat: 55 };
    const { events } = tick(hot, [{ type: 'siphon', amountKobo: MILLION }]);
    expect(events.some((e) => e.type === 'heat_threshold')).toBe(false);
  });
});
