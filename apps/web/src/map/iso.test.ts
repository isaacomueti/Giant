import { describe, expect, it } from 'vitest';
import { clampCamera, screenToWorld, zoomAt } from './camera';
import { TILE_H, tileCentre, tileToWorld, worldToTile } from './iso';

describe('iso projection', () => {
  it('round-trips every tile centre', () => {
    for (let x = 0; x < 24; x++) {
      for (let y = 0; y < 24; y++) {
        const c = tileCentre(x, y);
        expect(worldToTile(c.x, c.y)).toEqual({ x, y });
      }
    }
  });

  it('puts tile (1, 0) down and to the right of (0, 0)', () => {
    const a = tileToWorld(0, 0);
    const b = tileToWorld(1, 0);
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBe(a.y + TILE_H / 2);
  });
});

describe('camera', () => {
  it('keeps the anchor point fixed while zooming', () => {
    const cam = { x: 100, y: 50, scale: 1 };
    const anchor = { x: 180, y: 300 };
    const before = screenToWorld(cam, anchor);
    const after = screenToWorld(zoomAt(cam, anchor, 1.7), anchor);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('limits zoom', () => {
    const cam = { x: 0, y: 0, scale: 1 };
    expect(zoomAt(cam, { x: 0, y: 0 }, 100).scale).toBe(2.5);
    expect(zoomAt(cam, { x: 0, y: 0 }, 0.001).scale).toBe(0.3);
  });

  it('pulls a camera that wandered off the map back over it', () => {
    const view = { width: 360, height: 640 };
    const lost = { x: 99_999, y: -99_999, scale: 1 };
    const fixed = clampCamera(lost, view, 24);
    const centre = screenToWorld(fixed, { x: 180, y: 320 });
    expect(centre.x).toBeLessThanOrEqual(24 * 32);
    expect(centre.y).toBeGreaterThanOrEqual(0);
  });
});
