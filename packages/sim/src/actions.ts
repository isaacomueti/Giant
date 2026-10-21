import type { BuildingType, FaithCommunity } from '@giant/content';

export interface BuildAction {
  type: 'build';
  building: BuildingType;
  x: number;
  y: number;
  faith?: FaithCommunity;
}

export type Action = { type: 'siphon'; amountKobo: number } | BuildAction;
