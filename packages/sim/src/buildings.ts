import { BUILDINGS, MAP, isRoad } from '@giant/content';
import type { BuildAction } from './actions';
import type { GameState } from './state';

/** Why the build can't happen, or null if it can. */
export function buildRejection(state: GameState, action: BuildAction): string | null {
  const spec = BUILDINGS[action.building];
  if (!spec) return 'Unknown building.';
  const { x, y } = action;
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= MAP.size ||
    y >= MAP.size
  ) {
    return 'That spot is outside Ward 7.';
  }
  if (isRoad(x, y)) return 'You cannot build on the road.';
  if (state.buildings.some((b) => b.x === x && b.y === y))
    return 'Something is already built there.';
  if (spec.unique && state.buildings.some((b) => b.type === action.building)) {
    return `Ward 7 already has a ${spec.name.toLowerCase()}.`;
  }
  if (action.building === 'faith_land_grant' && !action.faith) {
    return 'Choose a church or mosque community for the grant.';
  }
  if (action.building !== 'faith_land_grant' && action.faith) {
    return 'Only faith land grants go to a faith community.';
  }
  if (spec.buildCostKobo > state.treasury.balanceKobo) return 'The treasury cannot cover it.';
  return null;
}
