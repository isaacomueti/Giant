import { BUILDINGS } from '@giant/content';
import { createGame, tick, type Action, type BuildAction, type GameState } from '@giant/sim';
import { useCallback, useMemo, useState } from 'react';

export interface PlaceResult {
  ok: boolean;
  message: string;
}

const SEED = 2026;

/**
 * Holds the game state plus the actions the player has queued for this month.
 * Every check goes through the sim itself, so the UI can never disagree with it.
 */
export function useGame() {
  const [state, setState] = useState<GameState>(() => createGame(SEED));
  const [pending, setPending] = useState<Action[]>([]);

  const pendingBuilds = useMemo(
    () => pending.filter((a): a is BuildAction => a.type === 'build'),
    [pending],
  );

  const committedKobo = useMemo(
    () => pendingBuilds.reduce((sum, a) => sum + BUILDINGS[a.building].buildCostKobo, 0),
    [pendingBuilds],
  );

  const place = useCallback(
    (action: BuildAction): PlaceResult => {
      const { events } = tick(state, [...pending, action]);
      const rejection = events.find((e) => e.type === 'action_rejected' && e.action === action);
      if (rejection && rejection.type === 'action_rejected') {
        return { ok: false, message: rejection.reason };
      }
      setPending((p) => [...p, action]);
      return { ok: true, message: `${BUILDINGS[action.building].name} planned for this month.` };
    },
    [state, pending],
  );

  const cancelAt = useCallback(
    (x: number, y: number): boolean => {
      const index = pending.findIndex((a) => a.type === 'build' && a.x === x && a.y === y);
      if (index === -1) return false;
      setPending((p) => p.filter((_, i) => i !== index));
      return true;
    },
    [pending],
  );

  const endMonth = useCallback(() => {
    const result = tick(state, pending);
    setState(result.state);
    setPending([]);
    return result.events;
  }, [state, pending]);

  return { state, pending, pendingBuilds, committedKobo, place, cancelAt, endMonth };
}
