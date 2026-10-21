import {
  BUILDINGS,
  FOOD_ITEMS,
  HEAT,
  MONTHLY,
  PRICES,
  ROADS,
  type BuildingType,
} from '@giant/content';
import type { Action } from './actions';
import { approvalTargets, driftApproval } from './approval';
import { buildRejection } from './buildings';
import { computePrices, driftToward, roadQualityTarget } from './economy';
import type { SimEvent } from './events';
import { clampHeat, siphonHeat, thresholdsCrossed } from './heat';
import { post } from './money';
import { Rng } from './rng';
import type { GameState } from './state';

export interface TickResult {
  state: GameState;
  events: SimEvent[];
}

/**
 * Advances the game by one in-game month. Pure: the same state, actions and
 * RNG seed always produce the same result. Order: player actions, roads and
 * prices, recurring money, approval, then heat.
 */
export function tick(
  state: GameState,
  actions: readonly Action[],
  rng = new Rng(state.rng),
): TickResult {
  const events: SimEvent[] = [];
  const month = state.month + 1;
  let { treasury, personal, buildings, nextBuildingId } = state;
  const heatBefore = state.heat;
  let heat = state.heat;

  for (const action of actions) {
    switch (action.type) {
      case 'siphon': {
        const { amountKobo } = action;
        if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
          events.push({ type: 'action_rejected', action, reason: 'Amount must be positive kobo.' });
          break;
        }
        if (amountKobo > treasury.balanceKobo) {
          events.push({ type: 'action_rejected', action, reason: 'Treasury cannot cover it.' });
          break;
        }
        const memo = 'Contract "consultancy" fee';
        treasury = post(treasury, { month, category: 'siphon', amountKobo: -amountKobo, memo });
        personal = post(personal, { month, category: 'siphon', amountKobo, memo });
        heat += siphonHeat(amountKobo);
        break;
      }
      case 'build': {
        const reason = buildRejection({ ...state, treasury, buildings }, action);
        if (reason) {
          events.push({ type: 'action_rejected', action, reason });
          break;
        }
        const spec = BUILDINGS[action.building];
        const building = {
          id: nextBuildingId++,
          type: action.building,
          x: action.x,
          y: action.y,
          builtMonth: month,
          ...(action.faith ? { faith: action.faith } : {}),
        };
        buildings = [...buildings, building];
        treasury = post(treasury, {
          month,
          category: 'construction',
          amountKobo: -spec.buildCostKobo,
          memo: `Built: ${spec.name}`,
        });
        events.push({ type: 'building_built', building });
        break;
      }
    }
  }

  const roadQuality = driftToward(state.roadQuality, roadQualityTarget(buildings), ROADS.driftRate);
  const prices = computePrices({ buildings, roadQuality, fuelPriceKobo: state.fuelPriceKobo });
  for (const item of FOOD_ITEMS) {
    const fromKobo = state.prices[item];
    const toKobo = prices[item];
    if ((toKobo - fromKobo) * 100 >= fromKobo * PRICES.spikePercent) {
      events.push({ type: 'price_spike', item, fromKobo, toKobo });
    }
  }

  treasury = post(treasury, {
    month,
    category: 'ward_allocation',
    amountKobo: MONTHLY.wardAllocationKobo,
    memo: 'Monthly allocation from Mushin LG',
  });
  treasury = post(treasury, {
    month,
    category: 'staff_salaries',
    amountKobo: -MONTHLY.staffSalariesKobo,
    memo: 'Ward office staff salaries',
  });
  treasury = post(treasury, {
    month,
    category: 'councillor_salary',
    amountKobo: -MONTHLY.councillorSalaryKobo,
    memo: 'Councillor salary and allowances',
  });
  personal = post(personal, {
    month,
    category: 'councillor_salary',
    amountKobo: MONTHLY.councillorSalaryKobo,
    memo: 'Councillor salary and allowances',
  });
  personal = post(personal, {
    month,
    category: 'living_costs',
    amountKobo: -MONTHLY.livingCostsKobo,
    memo: 'Rent, food and family',
  });

  // One upkeep and one levy line per building type keeps statements readable.
  const counts = new Map<BuildingType, number>();
  for (const b of buildings) counts.set(b.type, (counts.get(b.type) ?? 0) + 1);
  for (const [type, count] of counts) {
    const spec = BUILDINGS[type];
    const label = count > 1 ? `${spec.name} ×${count}` : spec.name;
    if (spec.levyKobo) {
      treasury = post(treasury, {
        month,
        category: 'levies',
        amountKobo: spec.levyKobo * count,
        memo: `Levies: ${label}`,
      });
    }
    if (spec.upkeepKobo) {
      treasury = post(treasury, {
        month,
        category: 'upkeep',
        amountKobo: -spec.upkeepKobo * count,
        memo: `Upkeep: ${label}`,
      });
    }
  }

  const approval = driftApproval(state.approval, approvalTargets({ buildings, prices }));

  // Thresholds are judged on the month's peak, before it cools off.
  const peak = clampHeat(heat);
  for (const threshold of thresholdsCrossed(heatBefore, peak)) {
    events.push({ type: 'heat_threshold', threshold, heat: peak });
  }
  heat = clampHeat(peak - HEAT.monthlyDecay);

  events.push({ type: 'month_ended', month });

  return {
    state: {
      ...state,
      month,
      rng: rng.state,
      treasury,
      personal,
      heat,
      buildings,
      nextBuildingId,
      approval,
      roadQuality,
      prices,
    },
    events,
  };
}
