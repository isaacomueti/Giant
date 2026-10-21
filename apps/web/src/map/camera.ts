import { mapBounds, type Point } from './iso';

export interface Camera {
  /** Screen position of the world origin. */
  x: number;
  y: number;
  scale: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export const MIN_SCALE = 0.3;
export const MAX_SCALE = 2.5;

export function screenToWorld(cam: Camera, p: Point): Point {
  return { x: (p.x - cam.x) / cam.scale, y: (p.y - cam.y) / cam.scale };
}

/** Zoom by `factor`, keeping the world point under `anchor` (screen) fixed. */
export function zoomAt(cam: Camera, anchor: Point, factor: number): Camera {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, cam.scale * factor));
  const world = screenToWorld(cam, anchor);
  return { scale, x: anchor.x - world.x * scale, y: anchor.y - world.y * scale };
}

/** Keeps the centre of the screen over the map so it can't be lost off-screen. */
export function clampCamera(cam: Camera, view: Viewport, mapSize: number): Camera {
  const b = mapBounds(mapSize);
  const centre = screenToWorld(cam, { x: view.width / 2, y: view.height / 2 });
  const cx = Math.min(b.maxX, Math.max(b.minX, centre.x));
  const cy = Math.min(b.maxY, Math.max(b.minY, centre.y));
  return {
    scale: cam.scale,
    x: view.width / 2 - cx * cam.scale,
    y: view.height / 2 - cy * cam.scale,
  };
}

/** A camera centred on a world point, showing about `tilesAcross` tiles of width. */
export function cameraOn(world: Point, view: Viewport, tilesAcross: number, tileW: number): Camera {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.width / (tilesAcross * tileW)));
  return { scale, x: view.width / 2 - world.x * scale, y: view.height / 2 - world.y * scale };
}
