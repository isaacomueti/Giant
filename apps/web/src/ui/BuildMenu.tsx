import { BUILDINGS, BUILDING_TYPES, type BuildingType, type FaithCommunity } from '@giant/content';
import { formatNairaShort } from '../lib/money';
import { BUILDING_ART } from '../map/art';

export interface BuildChoice {
  building: BuildingType;
  faith?: FaithCommunity;
}

interface Item extends BuildChoice {
  key: string;
  label: string;
}

// Church and mosque land grants sit side by side and cost the same.
const ITEMS: Item[] = BUILDING_TYPES.filter((t) => !BUILDINGS[t].unique).flatMap((t): Item[] =>
  t === 'faith_land_grant'
    ? [
        { key: 'church', building: t, faith: 'church', label: 'Church land' },
        { key: 'mosque', building: t, faith: 'mosque', label: 'Mosque land' },
      ]
    : [{ key: t, building: t, label: BUILDINGS[t].name }],
);

interface Props {
  selected: BuildChoice | null;
  availableKobo: number;
  onSelect: (choice: BuildChoice | null) => void;
}

const sameChoice = (a: BuildChoice | null, b: BuildChoice) =>
  !!a && a.building === b.building && a.faith === b.faith;

export function BuildMenu({ selected, availableKobo, onSelect }: Props) {
  return (
    <nav
      aria-label="Build"
      className="border-t border-white/10 bg-[#0e2a1f] pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none]">
        {ITEMS.map((item) => {
          const spec = BUILDINGS[item.building];
          const active = sameChoice(selected, item);
          const affordable = spec.buildCostKobo <= availableKobo;
          const color = `#${BUILDING_ART[item.building].color.toString(16).padStart(6, '0')}`;
          return (
            <li key={item.key} className="shrink-0">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(active ? null : item)}
                className={`flex w-24 flex-col items-start rounded-lg border px-2 py-1.5 text-left ${
                  active ? 'border-emerald-300 bg-emerald-900' : 'border-white/10 bg-white/5'
                } ${affordable ? '' : 'opacity-50'}`}
              >
                <span className="mb-1 h-1.5 w-6 rounded-full" style={{ background: color }} />
                <span className="text-xs leading-tight font-semibold">{item.label}</span>
                <span className="text-[11px] text-stone-300">
                  {formatNairaShort(spec.buildCostKobo)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
