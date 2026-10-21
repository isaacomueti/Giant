export const APPROVAL_GROUPS = ['youth', 'traders', 'transport', 'families', 'elites'] as const;
export type ApprovalGroup = (typeof APPROVAL_GROUPS)[number];

export const GROUP_LABELS: Record<ApprovalGroup, string> = {
  youth: 'Youth',
  traders: 'Traders and market women',
  transport: 'Transport workers',
  families: 'Families',
  elites: 'Elites',
};

export const FOOD_ITEMS = [
  'rice',
  'garri',
  'beans',
  'tomatoes',
  'bread',
  'transport_fare',
] as const;
export type FoodItem = (typeof FOOD_ITEMS)[number];

export const FOOD_LABELS: Record<FoodItem, string> = {
  rice: 'Rice (paint bucket)',
  garri: 'Garri (paint bucket)',
  beans: 'Beans (paint bucket)',
  tomatoes: 'Tomatoes (small basket)',
  bread: 'Bread (loaf)',
  transport_fare: 'Danfo fare, Mushin to Oshodi',
};

export const BUILDING_TYPES = [
  'ward_office',
  'market',
  'primary_school',
  'borehole',
  'health_centre',
  'motor_park',
  'police_post',
  'drainage',
  'solar_streetlights',
  'faith_land_grant',
] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

/** Faith land grants go to a church or a mosque; both are treated identically. */
export type FaithCommunity = 'church' | 'mosque';

export interface BuildingSpec {
  name: string;
  buildCostKobo: number;
  upkeepKobo: number;
  jobs: number;
  /** Only one may exist in the ward. */
  unique?: boolean;
  /** Monthly levy income into the treasury. */
  levyKobo?: number;
  /** Points added to each group's approval target while the building stands. */
  approval?: Partial<Record<ApprovalGroup, number>>;
  /** Percentage points knocked off an item's price while the building stands. */
  supplyRelief?: Partial<Record<FoodItem, number>>;
  /** Points added to the ward's road quality target. */
  roadQuality?: number;
}
