import { MAP, isRoad } from '@giant/content';
import type { BuildAction, Building } from '@giant/sim';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { BUILDING_ART, GROUND } from './art';
import { cameraOn, clampCamera, zoomAt, screenToWorld, type Camera } from './camera';
import { TILE_H, TILE_W, tileCentre, tileToWorld, worldToTile, type Point } from './iso';

interface Props {
  buildings: readonly Building[];
  pending: readonly BuildAction[];
  onTileTap: (x: number, y: number) => void;
}

interface Scene {
  app: Application;
  world: Container;
  buildingLayer: Container;
  cursor: Graphics;
  camera: Camera;
  render: () => void;
}

/** Movement (screen px) below which a press counts as a tap, not a drag. */
const TAP_SLOP = 8;

function diamond(g: Graphics, tx: number, ty: number, inset = 0) {
  const t = tileToWorld(tx, ty);
  const hw = TILE_W / 2 - inset;
  const hh = TILE_H / 2 - inset / 2;
  const cy = t.y + TILE_H / 2;
  return g.poly([t.x, cy - hh, t.x + hw, cy, t.x, cy + hh, t.x - hw, cy]);
}

function drawGround(g: Graphics) {
  for (let x = 0; x < MAP.size; x++) {
    for (let y = 0; y < MAP.size; y++) {
      if (isRoad(x, y)) {
        diamond(g, x, y).fill(GROUND.road);
      } else {
        diamond(g, x, y)
          .fill((x + y) % 2 ? GROUND.earth : GROUND.earthAlt)
          .stroke({ width: 1, color: GROUND.grid, alpha: 0.35 });
      }
    }
  }
  // Centre lines along each street.
  for (let i = 0; i < MAP.size; i++) {
    if (i % MAP.roadEvery !== MAP.roadOffset) continue;
    const a = tileCentre(i, 0);
    const b = tileCentre(i, MAP.size - 1);
    const c = tileCentre(0, i);
    const d = tileCentre(MAP.size - 1, i);
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 1, color: GROUND.roadLine, alpha: 0.5 });
    g.moveTo(c.x, c.y).lineTo(d.x, d.y).stroke({ width: 1, color: GROUND.roadLine, alpha: 0.5 });
  }
}

/** Placeholder building: an isometric block with a short label on top. */
function drawBuilding(
  layer: Container,
  type: Building['type'],
  tx: number,
  ty: number,
  ghost: boolean,
) {
  const art = BUILDING_ART[type];
  const c = tileCentre(tx, ty);
  const hw = TILE_W / 2 - 8;
  const hh = TILE_H / 2 - 4;
  const h = art.height;
  const g = new Graphics();
  // Left face, right face, then top.
  g.poly([c.x - hw, c.y, c.x, c.y + hh, c.x, c.y + hh - h, c.x - hw, c.y - h]).fill(
    shade(art.color, 0.7),
  );
  g.poly([c.x + hw, c.y, c.x, c.y + hh, c.x, c.y + hh - h, c.x + hw, c.y - h]).fill(
    shade(art.color, 0.85),
  );
  g.poly([c.x, c.y - hh - h, c.x + hw, c.y - h, c.x, c.y + hh - h, c.x - hw, c.y - h]).fill(
    art.color,
  );
  if (ghost) {
    g.alpha = 0.55;
    g.poly([c.x, c.y - hh - h, c.x + hw, c.y - h, c.x, c.y + hh - h, c.x - hw, c.y - h]).stroke({
      width: 2,
      color: 0xffffff,
    });
  }
  layer.addChild(g);
  const label = new Text({
    text: art.label,
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 9, fontWeight: '700', fill: 0x111111 },
    resolution: 2,
  });
  label.anchor.set(0.5);
  label.position.set(c.x, c.y - h);
  label.alpha = ghost ? 0.7 : 1;
  layer.addChild(label);
}

function shade(color: number, f: number): number {
  const r = Math.round(((color >> 16) & 0xff) * f);
  const g = Math.round(((color >> 8) & 0xff) * f);
  const b = Math.round((color & 0xff) * f);
  return (r << 16) | (g << 8) | b;
}

export function WardMap({ buildings, pending, onTileTap }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const tapRef = useRef(onTileTap);
  // Bumped once Pixi has initialised so the buildings effect draws.
  const [ready, setReady] = useState(0);

  useEffect(() => {
    tapRef.current = onTileTap;
  }, [onTileTap]);

  // Create the Pixi app once. The ticker stays off: we render only when
  // something changes, which saves battery on phones.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let cleanup = () => {};
    const app = new Application();

    app
      .init({
        width: host.clientWidth || 360,
        height: host.clientHeight || 480,
        background: GROUND.background,
        antialias: false,
        autoStart: false,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        preference: 'webgl',
      })
      .then(() => {
        if (cancelled) {
          app.destroy(true, { children: true });
          return;
        }
        app.ticker.stop();
        host.appendChild(app.canvas);
        app.canvas.style.display = 'block';

        const world = new Container();
        const ground = new Graphics();
        drawGround(ground);
        const buildingLayer = new Container();
        const cursor = new Graphics();
        world.addChild(ground, cursor, buildingLayer);
        app.stage.addChild(world);

        const view = () => ({ width: app.screen.width, height: app.screen.height });
        const start = tileCentre(MAP.wardOffice.x, MAP.wardOffice.y);
        const scene: Scene = {
          app,
          world,
          buildingLayer,
          cursor,
          camera: cameraOn(start, view(), 9, TILE_W),
          render: () => {
            scene.camera = clampCamera(scene.camera, view(), MAP.size);
            world.position.set(scene.camera.x, scene.camera.y);
            world.scale.set(scene.camera.scale);
            app.render();
          },
        };
        sceneRef.current = scene;

        // Gestures: one finger pans, two fingers pinch-zoom, a still press taps.
        const pointers = new Map<number, Point>();
        let moved = 0;
        let pinchDist = 0;
        const local = (e: PointerEvent): Point => {
          const r = app.canvas.getBoundingClientRect();
          return { x: e.clientX - r.left, y: e.clientY - r.top };
        };
        const mid = () => {
          const [a, b] = [...pointers.values()] as [Point, Point];
          return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
        };

        const down = (e: PointerEvent) => {
          app.canvas.setPointerCapture(e.pointerId);
          pointers.set(e.pointerId, local(e));
          if (pointers.size === 1) moved = 0;
          if (pointers.size === 2) {
            pinchDist = mid().d;
            moved = TAP_SLOP + 1; // a pinch is never a tap
          }
        };
        const move = (e: PointerEvent) => {
          const prev = pointers.get(e.pointerId);
          if (!prev) return;
          const p = local(e);
          if (pointers.size === 1) {
            moved += Math.hypot(p.x - prev.x, p.y - prev.y);
            pointers.set(e.pointerId, p);
            if (moved > TAP_SLOP) {
              scene.camera = {
                ...scene.camera,
                x: scene.camera.x + p.x - prev.x,
                y: scene.camera.y + p.y - prev.y,
              };
              scene.render();
            }
          } else if (pointers.size === 2) {
            const before = mid();
            pointers.set(e.pointerId, p);
            const after = mid();
            let cam = {
              ...scene.camera,
              x: scene.camera.x + after.x - before.x,
              y: scene.camera.y + after.y - before.y,
            };
            if (pinchDist > 0) cam = zoomAt(cam, after, after.d / pinchDist);
            pinchDist = after.d;
            scene.camera = cam;
            scene.render();
          }
        };
        const up = (e: PointerEvent) => {
          const p = pointers.get(e.pointerId);
          pointers.delete(e.pointerId);
          if (p && pointers.size === 0 && moved <= TAP_SLOP) {
            const w = screenToWorld(scene.camera, p);
            const t = worldToTile(w.x, w.y);
            if (t.x >= 0 && t.y >= 0 && t.x < MAP.size && t.y < MAP.size) {
              cursor.clear();
              diamond(cursor, t.x, t.y).stroke({ width: 2, color: GROUND.cursorOk });
              scene.render();
              tapRef.current(t.x, t.y);
            }
          }
          if (pointers.size < 2) pinchDist = 0;
        };
        const wheel = (e: WheelEvent) => {
          e.preventDefault();
          const r = app.canvas.getBoundingClientRect();
          const anchor = { x: e.clientX - r.left, y: e.clientY - r.top };
          scene.camera = zoomAt(scene.camera, anchor, e.deltaY < 0 ? 1.15 : 1 / 1.15);
          scene.render();
        };

        const canvas = app.canvas;
        canvas.addEventListener('pointerdown', down);
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointercancel', up);
        canvas.addEventListener('wheel', wheel, { passive: false });

        const resize = new ResizeObserver(() => {
          app.renderer.resize(host.clientWidth, host.clientHeight);
          scene.render();
        });
        resize.observe(host);

        cleanup = () => {
          resize.disconnect();
          canvas.removeEventListener('pointerdown', down);
          canvas.removeEventListener('pointermove', move);
          canvas.removeEventListener('pointerup', up);
          canvas.removeEventListener('pointercancel', up);
          canvas.removeEventListener('wheel', wheel);
          sceneRef.current = null;
          app.destroy(true, { children: true });
        };
        // Draw buildings that arrived before init finished.
        setReady((n) => n + 1);
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  // Redraw buildings whenever the game changes. Back-to-front by depth.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const layer = scene.buildingLayer;
    for (const child of layer.removeChildren()) child.destroy();
    const items = [
      ...buildings.map((b) => ({ type: b.type, x: b.x, y: b.y, ghost: false })),
      ...pending.map((a) => ({ type: a.building, x: a.x, y: a.y, ghost: true })),
    ].sort((a, b) => a.x + a.y - (b.x + b.y));
    for (const item of items) drawBuilding(layer, item.type, item.x, item.y, item.ghost);
    scene.render();
  }, [buildings, pending, ready]);

  return <div ref={hostRef} className="h-full w-full touch-none select-none overflow-hidden" />;
}
