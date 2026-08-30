export type Point = [x: number, y: number, z: number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Position along a point list, with t running 0-1 over the whole path.
 *
 * ponytail: straight lerp between points, so corners are faceted. That is invisible on one
 * aircraft crossing a wide sky; swap in THREE.CatmullRomCurve3 built from the same points
 * if a route ever has corners tight enough to see.
 */
export function pointOnPath(path: readonly Point[], t: number): Point {
  const segments = path.length - 1;
  const first = path[0] ?? [0, 0, 0];
  if (segments < 1) return [...first];

  const scaled = Math.min(Math.max(t, 0), 1) * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  const local = scaled - index;
  const a = path[index] ?? first;
  const b = path[index + 1] ?? first;
  return [lerp(a[0], b[0], local), lerp(a[1], b[1], local), lerp(a[2], b[2], local)];
}
