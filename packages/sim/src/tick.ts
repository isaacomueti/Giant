import { HEAT, MONTHLY } from '@giant/content';
import type { Action } from './actions';
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
 * RNG seed always produce the same result. Actions apply first, then the
 * month's recurring income and costs, then heat decay.
 */
export function tick(
  state: GameState,
  actions: readonly Action[],
  rng = new Rng(state.rng),
): TickResult {
  const events: SimEvent[] = [];
  const month = state.month + 1;
  let { treasury, personal } = state;
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

  // Thresholds are judged on the month's peak, before it cools off.
  const peak = clampHeat(heat);
  for (const threshold of thresholdsCrossed(heatBefore, peak)) {
    events.push({ type: 'heat_threshold', threshold, heat: peak });
  }
  heat = clampHeat(peak - HEAT.monthlyDecay);

  events.push({ type: 'month_ended', month });

  return {
    state: { ...state, month, rng: rng.state, treasury, personal, heat },
    events,
  };
}
