import {
  APPROVAL,
  APPROVAL_GROUPS,
  BUILDINGS,
  BUILDING_TYPES,
  FAITH,
  START,
  type BuildingType,
  type FaithCommunity,
} from '@giant/content';
import { describe, expect, it } from 'vitest';
import { approvalTargets, driftApproval, faithImbalancePenalty, totalJobs } from './approval';
import { computePrices } from './economy';
import type { Building } from './state';

let nextId = 1;
const at = (type: BuildingType, faith?: FaithCommunity): Building => ({
  id: nextId,
  type,
  x: nextId++,
  y: 0,
  builtMonth: 0,
  ...(faith ? { faith } : {}),
});
const startPrices = computePrices({
  buildings: [],
  roadQuality: START.roadQuality,
  fuelPriceKobo: START.fuelPriceKobo,
});
const targetsWith = (buildings: Building[], prices = startPrices) =>
  approvalTargets({ buildings, prices });

describe('approval targets', () => {
  it('equal the starting approval with no buildings at starting prices', () => {
    expect(targetsWith([])).toEqual(START.approval);
  });

  it.each(BUILDING_TYPES.filter((t) => t !== 'faith_land_grant'))(
    '%s moves each group by its listed effect',
    (type) => {
      // Prices are held at reference so only the building's own effects show.
      const targets = targetsWith([at(type)]);
      const jobsBonus = Math.floor(BUILDINGS[type].jobs / APPROVAL.jobsPerPoint);
      for (const group of APPROVAL_GROUPS) {
        const effect = BUILDINGS[type].approval?.[group] ?? 0;
        const jobs = group === 'youth' || group === 'families' ? jobsBonus : 0;
        expect(targets[group]).toBe(START.approval[group] + effect + jobs);
      }
    },
  );

  it('rewards jobs for youth and families', () => {
    expect(totalJobs([at('market')])).toBe(BUILDINGS.market.jobs);
    const many = Array.from({ length: 5 }, () => at('motor_park'));
    const targets = targetsWith(many);
    expect(targets.youth).toBeGreaterThan(START.approval.youth + 5 * 2);
  });

  it('drop for every group when the basket gets dearer', () => {
    const dear = computePrices({
      buildings: [],
      roadQuality: START.roadQuality,
      fuelPriceKobo: START.fuelPriceKobo * 2,
    });
    const targets = targetsWith([], dear);
    for (const group of APPROVAL_GROUPS) {
      expect(targets[group]).toBeLessThanOrEqual(START.approval[group]);
    }
    expect(targets.families).toBeLessThan(START.approval.families);
    expect(START.approval.families - targets.families).toBeGreaterThan(
      START.approval.elites - targets.elites,
    );
  });

  it('cap the building bonus', () => {
    const many = Array.from({ length: 20 }, () => at('primary_school'));
    const targets = targetsWith(many);
    expect(targets.families).toBeLessThanOrEqual(
      START.approval.families + APPROVAL.maxBuildingBonus + APPROVAL.maxJobsBonus,
    );
  });

  it('stay within 0 to 100', () => {
    const awful = computePrices({ buildings: [], roadQuality: 0, fuelPriceKobo: 10_000_000 });
    for (const value of Object.values(targetsWith([], awful))) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});

describe('faith land grants', () => {
  it('give the same effect to a church or a mosque', () => {
    expect(targetsWith([at('faith_land_grant', 'church')])).toEqual(
      targetsWith([at('faith_land_grant', 'mosque')]),
    );
  });

  it('cost trust across the board when one community is favoured', () => {
    const fair = [at('faith_land_grant', 'church'), at('faith_land_grant', 'mosque')];
    const lopsided = [
      at('faith_land_grant', 'mosque'),
      at('faith_land_grant', 'mosque'),
      at('faith_land_grant', 'mosque'),
    ];
    expect(faithImbalancePenalty(fair)).toBe(0);
    expect(faithImbalancePenalty(lopsided)).toBe(
      (3 - FAITH.allowedImbalance) * FAITH.imbalancePenalty,
    );
    const sameForChurch = lopsided.map((b) => ({ ...b, faith: 'church' as const }));
    expect(faithImbalancePenalty(sameForChurch)).toBe(faithImbalancePenalty(lopsided));
  });
});

describe('approval drift', () => {
  it('moves part of the way to the target each month', () => {
    const now = { ...START.approval, families: 50 };
    const next = driftApproval(now, { ...START.approval, families: 70 });
    expect(next.families).toBe(55);
  });

  it('always moves at least one point and never overshoots', () => {
    const next = driftApproval({ ...START.approval, youth: 44 }, { ...START.approval, youth: 45 });
    expect(next.youth).toBe(45);
  });
});
