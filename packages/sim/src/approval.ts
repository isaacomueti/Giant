import {
  APPROVAL,
  APPROVAL_GROUPS,
  BUILDINGS,
  FAITH,
  START,
  type ApprovalGroup,
} from '@giant/content';
import { REFERENCE_BASKET_KOBO, basketCost, driftToward } from './economy';
import type { Building, GameState } from './state';

export function totalJobs(buildings: readonly Building[]): number {
  return buildings.reduce((sum, b) => sum + BUILDINGS[b.type].jobs, 0);
}

/** Approval points lost by every group when faith grants favour one community. */
export function faithImbalancePenalty(buildings: readonly Building[]): number {
  let church = 0;
  let mosque = 0;
  for (const b of buildings) {
    if (b.faith === 'church') church++;
    if (b.faith === 'mosque') mosque++;
  }
  const excess = Math.abs(church - mosque) - FAITH.allowedImbalance;
  return excess > 0 ? excess * FAITH.imbalancePenalty : 0;
}

/** Percentage the household basket costs above (or below) the reference basket. */
export function pricePressurePercent(state: Pick<GameState, 'prices'>): number {
  return (basketCost(state.prices) / REFERENCE_BASKET_KOBO - 1) * 100;
}

export function approvalTargets(
  state: Pick<GameState, 'buildings' | 'prices'>,
): Record<ApprovalGroup, number> {
  const bonus = Object.fromEntries(APPROVAL_GROUPS.map((g) => [g, 0])) as Record<
    ApprovalGroup,
    number
  >;
  for (const b of state.buildings) {
    for (const [group, points] of Object.entries(BUILDINGS[b.type].approval ?? {})) {
      bonus[group as ApprovalGroup] += points;
    }
  }
  const jobsBonus = Math.min(
    APPROVAL.maxJobsBonus,
    Math.floor(totalJobs(state.buildings) / APPROVAL.jobsPerPoint),
  );
  const pressure = pricePressurePercent(state);
  const faithPenalty = faithImbalancePenalty(state.buildings);

  const targets = {} as Record<ApprovalGroup, number>;
  for (const group of APPROVAL_GROUPS) {
    let target = START.approval[group] + Math.min(APPROVAL.maxBuildingBonus, bonus[group]);
    if (group === 'youth' || group === 'families') target += jobsBonus;
    target -= pressure * APPROVAL.priceSensitivity[group];
    target -= faithPenalty;
    targets[group] = clampApproval(Math.round(target));
  }
  return targets;
}

export function clampApproval(value: number): number {
  return Math.min(APPROVAL.max, Math.max(APPROVAL.min, value));
}

/** Moves each group's approval one month toward its target. */
export function driftApproval(
  approval: Record<ApprovalGroup, number>,
  targets: Record<ApprovalGroup, number>,
): Record<ApprovalGroup, number> {
  const next = {} as Record<ApprovalGroup, number>;
  for (const group of APPROVAL_GROUPS) {
    next[group] = clampApproval(driftToward(approval[group], targets[group], APPROVAL.driftRate));
  }
  return next;
}
