import type { HeatThreshold } from '@giant/content';
import type { Action } from './actions';

export type SimEvent =
  | { type: 'month_ended'; month: number }
  | { type: 'heat_threshold'; threshold: HeatThreshold; heat: number }
  | { type: 'action_rejected'; action: Action; reason: string };
