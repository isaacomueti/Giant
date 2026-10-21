import { BUILDINGS, MAP, START } from '@giant/content';
import { describe, expect, it } from 'vitest';
import type { Action, BuildAction } from './actions';
import { isBalanced } from './money';
import { createGame, type GameState } from './state';
import { tick } from './tick';

const build = (
  building: BuildAction['building'],
  x: number,
  y: number,
  extra = {},
): BuildAction => ({
  type: 'build',
  building,
  x,
  y,
  ...extra,
});
const rejected = (events: ReturnType<typeof tick>['events']) =>
  events.filter((e) => e.type === 'action_rejected');

describe('building', () => {
  it('starts the ward with its office', () => {
    const state = createGame(1);
    expect(state.buildings).toEqual([
      { id: 1, type: 'ward_office', x: MAP.wardOffice.x, y: MAP.wardOffice.y, builtMonth: 0 },
    ]);
  });

  it('places a building and charges the treasury its build cost', () => {
    const plain = tick(createGame(1), []).state;
    const { state, events } = tick(createGame(1), [build('borehole', 2, 3)]);
    expect(state.buildings).toHaveLength(2);
    expect(state.buildings[1]).toMatchObject({ type: 'borehole', x: 2, y: 3, builtMonth: 1 });
    expect(events).toContainEqual({ type: 'building_built', building: state.buildings[1] });
    expect(state.treasury.balanceKobo).toBe(
      plain.treasury.balanceKobo - BUILDINGS.borehole.buildCostKobo - BUILDINGS.borehole.upkeepKobo,
    );
    expect(isBalanced(state.treasury)).toBe(true);
  });

  it('gives each building a fresh id', () => {
    const { state } = tick(createGame(1), [build('borehole', 0, 0), build('borehole', 1, 0)]);
    expect(state.buildings.map((b) => b.id)).toEqual([1, 2, 3]);
    expect(state.nextBuildingId).toBe(4);
  });

  it.each([
    ['off the map', build('borehole', MAP.size, 0)],
    ['negative tiles', build('borehole', -1, 0)],
    ['fractional tiles', build('borehole', 1.5, 0)],
    ['a road tile', build('borehole', MAP.roadOffset, 0)],
    ['an occupied tile', build('borehole', MAP.wardOffice.x, MAP.wardOffice.y)],
    ['a second ward office', build('ward_office', 0, 0)],
    ['a faith grant with no community', build('faith_land_grant', 0, 0)],
    ['a community on a non-faith building', build('market', 0, 0, { faith: 'church' })],
  ])('rejects %s', (_label, action) => {
    const { state, events } = tick(createGame(1), [action]);
    expect(rejected(events)).toHaveLength(1);
    expect(state.buildings).toHaveLength(1);
    expect(state.treasury.ledger.some((e) => e.category === 'construction')).toBe(false);
  });

  it('rejects two buildings on the same tile in one month', () => {
    const { state, events } = tick(createGame(1), [build('borehole', 0, 0), build('market', 0, 0)]);
    expect(rejected(events)).toHaveLength(1);
    expect(state.buildings).toHaveLength(2);
  });

  it('rejects a building the treasury cannot afford', () => {
    const broke: GameState = {
      ...createGame(1),
      treasury: { openingKobo: 0, balanceKobo: 0, ledger: [] },
    };
    const { events } = tick(broke, [build('market', 0, 0)]);
    expect(rejected(events)).toHaveLength(1);
  });

  it('accepts a faith land grant to either community', () => {
    for (const faith of ['church', 'mosque'] as const) {
      const { state } = tick(createGame(1), [build('faith_land_grant', 0, 0, { faith })]);
      expect(state.buildings[1]).toMatchObject({ type: 'faith_land_grant', faith });
    }
  });
});

describe('monthly building money', () => {
  it('collects levies and pays upkeep, one line per building type', () => {
    let state = createGame(1);
    state = tick(state, [
      build('market', 0, 0),
      build('borehole', 1, 0),
      build('borehole', 2, 0),
    ]).state;
    const month2 = tick(state, []).state;
    const lines = month2.treasury.ledger.filter((e) => e.month === 2);
    expect(lines).toContainEqual(
      expect.objectContaining({ category: 'levies', amountKobo: BUILDINGS.market.levyKobo }),
    );
    expect(lines).toContainEqual(
      expect.objectContaining({
        category: 'upkeep',
        amountKobo: -2 * BUILDINGS.borehole.upkeepKobo,
        memo: 'Upkeep: Borehole ×2',
      }),
    );
    expect(lines.filter((e) => e.category === 'upkeep')).toHaveLength(3); // office, market, boreholes
    expect(isBalanced(month2.treasury)).toBe(true);
  });
});

describe('ward economy over time', () => {
  it('improves roads and lowers prices after drainage', () => {
    let state = tick(createGame(1), [build('drainage', 0, 0)]).state;
    for (let i = 0; i < 12; i++) state = tick(state, []).state;
    expect(state.roadQuality).toBe(START.roadQuality + (BUILDINGS.drainage.roadQuality ?? 0));
    expect(state.prices.tomatoes).toBeLessThan(createGame(1).prices.tomatoes);
  });

  it('raises traders approval after a market opens', () => {
    let state = tick(createGame(1), [build('market', 0, 0)]).state;
    for (let i = 0; i < 12; i++) state = tick(state, []).state;
    expect(state.approval.traders).toBeGreaterThan(START.approval.traders);
  });

  it('emits a price spike when fuel jumps, and approval sags', () => {
    const state = { ...createGame(1), fuelPriceKobo: START.fuelPriceKobo * 2 };
    const { events, state: after } = tick(state, []);
    const spikes = events.filter((e) => e.type === 'price_spike').map((e) => e.item);
    expect(spikes).toContain('transport_fare');
    expect(after.approval.families).toBeLessThan(START.approval.families);
  });

  it('is deterministic with builds and siphons mixed in', () => {
    const script: Action[][] = [
      [build('market', 3, 3), { type: 'siphon', amountKobo: 50_000_000 }],
      [build('faith_land_grant', 4, 4, { faith: 'mosque' })],
      [build('faith_land_grant', 6, 4, { faith: 'church' })],
      [],
    ];
    const play = () => script.reduce((s, actions) => tick(s, actions).state, createGame(77));
    expect(play()).toEqual(play());
  });
});
