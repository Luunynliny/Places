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

export type ProfilePoint = [x: number, value: number];

/**
 * A value read off a list of [x, value] pairs, linear between them and held flat past
 * either end rather than extrapolating. Used for anything authored as a curve: the far
 * shell's height against distance, the weather's intensity against time.
 *
 * The pairs must be ordered by x.
 */
export function sampleProfile(profile: readonly ProfilePoint[], x: number): number {
  const first = profile[0];
  const last = profile[profile.length - 1];
  if (!first || !last) return 0;
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];

  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1];
    const b = profile[i];
    if (a && b && x <= b[0]) {
      const span = b[0] - a[0];
      return span === 0 ? b[1] : lerp(a[1], b[1], (x - a[0]) / span);
    }
  }
  return last[1];
}
