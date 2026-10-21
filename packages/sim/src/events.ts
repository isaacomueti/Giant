import type { FoodItem, HeatThreshold } from '@giant/content';
import type { Action } from './actions';
import type { Building } from './state';

export type SimEvent =
  | { type: 'month_ended'; month: number }
  | { type: 'heat_threshold'; threshold: HeatThreshold; heat: number }
  | { type: 'action_rejected'; action: Action; reason: string }
  | { type: 'building_built'; building: Building }
  | { type: 'price_spike'; item: FoodItem; fromKobo: number; toKobo: number };
