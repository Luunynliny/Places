import { type Collider, sceneBounds } from "./scene-data.ts";

export const PLAYER_RADIUS = 0.35;

/**
 * Deep rather than thin: a thin wall is tunnelled straight through by one oversized
 * frame step, which is exactly what a backgrounded tab produces on its first frame back.
 * The walls are invisible, so depth costs nothing and removes the failure mode entirely.
 */
const WALL_THICKNESS = 20;
const WALL_HEIGHT = 4;

/**
 * The clearing's own edges, as real box colliders sitting just outside sceneBounds.
 * "Enclosed" then goes through the same code path as every other solid thing instead of
 * being a special-cased clamp, which is what keeps the boundary swappable later.
 */
export function boundaryColliders(): Collider[] {
  const { minX, maxX, minZ, maxZ } = sceneBounds;
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const midX = (minX + maxX) / 2;
  const midZ = (minZ + maxZ) / 2;
  const y = WALL_HEIGHT / 2;
  const half = WALL_THICKNESS / 2;
  const span = WALL_THICKNESS * 2;
  return [
    {
      type: "box",
      center: [midX, y, minZ - half],
      size: [width + span, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      type: "box",
      center: [midX, y, maxZ + half],
      size: [width + span, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      type: "box",
      center: [minX - half, y, midZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, depth + span],
    },
    {
      type: "box",
      center: [maxX + half, y, midZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, depth + span],
    },
  ];
}

/**
 * Whether a player-sized circle at (x, z) overlaps any collider, tested against the
 * closest point on each box rather than its bounding square, so you can round a corner
 * diagonally instead of snagging on empty space beside it.
 *
 * ponytail: flat 2D test, Y is ignored — every collider is treated as full height.
 * Sample the collider's Y extent once there is something to duck under or step onto.
 */
export function collidesAt(
  x: number,
  z: number,
  colliders: readonly Collider[],
  radius = PLAYER_RADIUS,
): boolean {
  for (const collider of colliders) {
    if (collider.type !== "box") continue;
    const [centerX, , centerZ] = collider.center;
    const [sizeX, , sizeZ] = collider.size;
    const dx = Math.max(Math.abs(x - centerX) - sizeX / 2, 0);
    const dz = Math.max(Math.abs(z - centerZ) - sizeZ / 2, 0);
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

/**
 * Apply a movement step, one axis at a time, so walking into a wall at an angle slides
 * along it instead of stopping dead.
 */
export function resolveMove(
  x: number,
  z: number,
  dx: number,
  dz: number,
  colliders: readonly Collider[],
): [x: number, z: number] {
  const nextX = collidesAt(x + dx, z, colliders) ? x : x + dx;
  const nextZ = collidesAt(nextX, z + dz, colliders) ? z : z + dz;
  return [nextX, nextZ];
}
