/**
 * Plain description of the Place. The renderer reads this and draws it; nothing here
 * is generated at runtime and nothing here imports Three.js. Every value is authored
 * once and identical in every session.
 *
 * The Place is a cabin clearing: a shallow bowl of turf, a packed path running north
 * from the south entrance, and a rocky rise along the north edge where the cabin sits.
 */

/** Walkable extent of the clearing, in metres. Doubles as the walk-mode boundary. */
export const sceneBounds = {
  minX: -12,
  maxX: 12,
  minZ: -12,
  maxZ: 12,
} as const;

/**
 * Ground height in metres, on a regular grid spanning sceneBounds.
 * Row 0 is the north edge (minZ), column 0 is the west edge (minX).
 * The border ring is 0 everywhere so the clearing meets the far shell flush.
 */
export const terrainHeights: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0.45, 0.6, 0.7, 0.72, 0.68, 0.55, 0.4, 0],
  [0, 0.4, 0.55, 0.62, 0.6, 0.55, 0.45, 0.3, 0],
  [0, 0.28, 0.35, 0.3, 0.22, 0.28, 0.32, 0.22, 0],
  [0, 0.18, 0.2, 0.12, 0.05, 0.12, 0.2, 0.15, 0],
  [0, 0.12, 0.14, 0.08, 0.02, 0.1, 0.16, 0.12, 0],
  [0, 0.15, 0.18, 0.14, 0.1, 0.16, 0.22, 0.16, 0],
  [0, 0.2, 0.26, 0.24, 0.22, 0.26, 0.3, 0.2, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

/**
 * Ground surface on the same grid as terrainHeights, one character per node.
 * Sampled and blended between nodes, so edges read soft rather than stencilled.
 */
export const surfaceGrid: string[] = [
  "ddrrrrrdd",
  "dgrrprggd",
  "dggpppggd",
  "dgggpgggd",
  "dgggppggd",
  "dgggppggd",
  "dggppgggd",
  "dggppgggd",
  "dddppdddd",
];

/** What each surfaceGrid character looks like. sRGB hex. */
export const surfacePalette: Record<string, number> = {
  g: 0x5f7048, // turf
  p: 0x9b8a68, // packed path
  r: 0x8b8880, // rock and scree
  d: 0x4a4433, // leaf litter under the treeline
};

/**
 * The land beyond the clearing, as a height profile against Chebyshev distance
 * (max(|x|, |z|)) from the centre — square rings, matching the square clearing.
 * Starts at 0 on the clearing edge so the two meshes meet without a step.
 */
export const farProfile: [distance: number, height: number][] = [
  [12, 0],
  [20, 1.5],
  [35, 6],
  [60, 14],
  [120, 24],
  [200, 30],
];

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
