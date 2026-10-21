import { formatNaira } from '../lib/money';

interface Props {
  month: number;
  treasuryKobo: number;
  committedKobo: number;
  plannedCount: number;
  onEndMonth: () => void;
}

export function Hud({ month, treasuryKobo, committedKobo, plannedCount, onEndMonth }: Props) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0e2a1f] px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="min-w-0">
        <p className="text-[11px] tracking-wide text-stone-400 uppercase">
          Ward 7, Mushin · Month {month}
        </p>
        <p className="truncate text-sm font-semibold">
          Treasury {formatNaira(treasuryKobo - committedKobo)}
        </p>
        {committedKobo > 0 && (
          <p className="text-[11px] text-amber-300">
            {formatNaira(committedKobo)} set aside for {plannedCount} planned{' '}
            {plannedCount === 1 ? 'project' : 'projects'}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onEndMonth}
        className="shrink-0 rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-bold text-emerald-950 active:bg-emerald-400"
      >
        End month
      </button>
    </header>
  );
}
