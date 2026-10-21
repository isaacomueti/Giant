import { BUILDINGS } from '@giant/content';
import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useGame } from './game/useGame';
import { formatNaira } from './lib/money';
import { BuildMenu, type BuildChoice } from './ui/BuildMenu';
import { Hud } from './ui/Hud';

// PixiJS is the heaviest download; load it after the rest of the UI so the
// screen appears quickly on slow networks.
const WardMap = lazy(() => import('./map/WardMap').then((m) => ({ default: m.WardMap })));

export function App() {
  const game = useGame();
  const [choice, setChoice] = useState<BuildChoice | null>(null);
  const [toast, setToast] = useState<{ text: string; bad: boolean } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const onTileTap = useCallback(
    (x: number, y: number) => {
      if (game.cancelAt(x, y)) {
        setToast({ text: 'Plan cancelled. The money is back in the treasury.', bad: false });
        return;
      }
      const existing = game.state.buildings.find((b) => b.x === x && b.y === y);
      if (!choice) {
        if (existing) {
          const name = BUILDINGS[existing.type].name;
          const faith = existing.faith ? ` (${existing.faith})` : '';
          const when =
            existing.builtMonth === 0
              ? 'already standing'
              : `built in month ${existing.builtMonth}`;
          setToast({ text: `${name}${faith}, ${when}.`, bad: false });
        } else {
          setToast({ text: 'Pick something to build from the menu below.', bad: false });
        }
        return;
      }
      const result = game.place({ type: 'build', x, y, ...choice });
      setToast({ text: result.message, bad: !result.ok });
    },
    [game, choice],
  );

  const endMonth = () => {
    const events = game.endMonth();
    const built = events.filter((e) => e.type === 'building_built').length;
    setChoice(null);
    setToast({
      text: built
        ? `Month closed. ${built} project${built === 1 ? '' : 's'} finished.`
        : 'Month closed.',
      bad: false,
    });
  };

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <Hud
        month={game.state.month}
        treasuryKobo={game.state.treasury.balanceKobo}
        committedKobo={game.committedKobo}
        plannedCount={game.pendingBuilds.length}
        onEndMonth={endMonth}
      />
      <div className="relative min-h-0 flex-1">
        <Suspense
          fallback={
            <p className="flex h-full items-center justify-center text-sm text-stone-400">
              Loading the map of Ward 7…
            </p>
          }
        >
          <WardMap
            buildings={game.state.buildings}
            pending={game.pendingBuilds}
            onTileTap={onTileTap}
          />
        </Suspense>
        {choice && (
          <p className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs whitespace-nowrap">
            Tap a plot to build: {BUILDINGS[choice.building].name}
            {choice.faith ? ` (${choice.faith})` : ''} ·{' '}
            {formatNaira(BUILDINGS[choice.building].buildCostKobo)}
          </p>
        )}
        {toast && (
          <p
            role="status"
            className={`absolute right-3 bottom-3 left-3 rounded-lg px-3 py-2 text-sm shadow-lg ${
              toast.bad ? 'bg-red-900/95' : 'bg-stone-900/95'
            }`}
          >
            {toast.text}
          </p>
        )}
      </div>
      <BuildMenu
        selected={choice}
        availableKobo={game.state.treasury.balanceKobo - game.committedKobo}
        onSelect={setChoice}
      />
    </div>
  );
}
