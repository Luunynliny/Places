/**
 * Plain description of the Place. The renderer reads this and draws it; nothing here
 * is generated at runtime and nothing here imports Three.js. Every position is authored
 * once and identical in every session.
 */

/** Outer shell of the Place. Doubles as the walk-mode boundary. */
export const sceneBounds = {
  minX: -8,
  maxX: 8,
  minZ: -8,
  maxZ: 8,
} as const;

export type BoxCollider = {
  type: "box";
  /** World-space centre, [x, y, z]. */
  center: [number, number, number];
  /** Full extents, [x, y, z]. */
  size: [number, number, number];
};

export type Collider = BoxCollider;

/** Solid volumes walk mode collides against. Filled in as objects are placed. */
export const colliders: Collider[] = [];

export type SceneObject = {
  id: string;
  /** Name of the THREE.Group factory in src/objects/ that builds this object. */
  factory: string;
  position: [number, number, number];
  /** Y rotation in radians. */
  rotation?: number;
  /** Key in `paths` for objects that move along a scripted route. */
  path?: string;
};

/** Every object in the Place, placed at a fixed position. */
export const objects: SceneObject[] = [];

/** Scripted routes, as plain point lists. Sampled with pointOnPath(). */
export const paths: Record<string, [number, number, number][]> = {};
