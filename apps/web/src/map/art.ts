import type { BuildingType } from '@giant/content';

/** Placeholder art until the Higgsfield pass: a coloured block and a short label. */
export const BUILDING_ART: Record<BuildingType, { color: number; height: number; label: string }> =
  {
    ward_office: { color: 0x2e7d32, height: 26, label: 'WARD' },
    market: { color: 0xf9a825, height: 14, label: 'MKT' },
    primary_school: { color: 0x1565c0, height: 18, label: 'SCH' },
    borehole: { color: 0x4fc3f7, height: 10, label: 'H2O' },
    health_centre: { color: 0xe53935, height: 18, label: 'PHC' },
    motor_park: { color: 0xfdd835, height: 6, label: 'PARK' },
    police_post: { color: 0x37474f, height: 16, label: 'POL' },
    drainage: { color: 0x6d4c41, height: 4, label: 'DRN' },
    solar_streetlights: { color: 0xffee58, height: 22, label: 'SUN' },
    faith_land_grant: { color: 0xab47bc, height: 20, label: 'FAITH' },
  };

export const GROUND = {
  earth: 0x8d6e4a,
  earthAlt: 0x86684a,
  road: 0x4a4a4a,
  roadLine: 0xf2c94c,
  grid: 0x6b5236,
  background: 0x0b1f17,
  cursorOk: 0xffffff,
  cursorBad: 0xff5252,
};
