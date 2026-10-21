/** Isometric tile size in world pixels (2:1 diamonds). */
export const TILE_W = 64;
export const TILE_H = 32;

export interface Point {
  x: number;
  y: number;
}

/** World position of a tile's top corner. */
export function tileToWorld(tx: number, ty: number): Point {
  return { x: ((tx - ty) * TILE_W) / 2, y: ((tx + ty) * TILE_H) / 2 };
}

/** World position of a tile's centre. */
export function tileCentre(tx: number, ty: number): Point {
  const top = tileToWorld(tx, ty);
  return { x: top.x, y: top.y + TILE_H / 2 };
}

/** The tile under a world point (may be off the map). */
export function worldToTile(wx: number, wy: number): Point {
  return {
    x: Math.floor(wy / TILE_H + wx / TILE_W),
    y: Math.floor(wy / TILE_H - wx / TILE_W),
  };
}

/** Bounding box of a size×size map in world pixels. */
export function mapBounds(size: number) {
  return {
    minX: (-size * TILE_W) / 2,
    maxX: (size * TILE_W) / 2,
    minY: 0,
    maxY: size * TILE_H,
  };
}
