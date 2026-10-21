import { HEAT, type HeatThreshold } from '@giant/content';

export function clampHeat(heat: number): number {
  return Math.min(HEAT.max, Math.max(HEAT.min, Math.round(heat)));
}

/** Thresholds crossed going upward from `before` to `after`, lowest first. */
export function thresholdsCrossed(before: number, after: number): HeatThreshold[] {
  return HEAT.thresholds.filter((t) => before < t && after >= t);
}

/** Heat added by siphoning the given amount. */
export function siphonHeat(amountKobo: number): number {
  const millions = amountKobo / (100 * 1_000_000);
  return Math.max(HEAT.minSiphonHeat, Math.ceil(millions * HEAT.perMillionNairaSiphoned));
}
