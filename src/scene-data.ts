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

/**
 * Weather is one of the only two things that change while you are inside, so unlike
 * everything else here it is a curve rather than a constant: intensity against seconds
 * into the cycle. It starts on a light drizzle so the Place is never dry on arrival, and
 * ends back on that same value so the loop has no seam.
 */
export const weatherCycle: [seconds: number, intensity: number][] = [
  [0, 0.35],
  [40, 0.72],
  [95, 1],
  [150, 0.45],
  [215, 0.08],
  [265, 0],
  [300, 0.35],
];

export const weatherCycleSeconds = 300;

/** The rain itself. Authored once; only its intensity varies. */
export const rain = {
  /** Streaks in the column that follows you around. */
  count: 5000,
  /** Width and depth of that column, in metres. It only needs to cover what you can see. */
  area: 30,
  height: 16,
  /** Metres per second, and how much of that a streak is long. */
  speed: 16,
  streak: 0.55,
  /** Sideways lean, in metres of drift per metre of fall. */
  slant: 0.18,
};

export type BoxCollider = {
  type: "box";
  /** World-space centre, [x, y, z]. */
  center: [number, number, number];
  /** Full extents, [x, y, z]. */
  size: [number, number, number];
  /**
   * The object this collider belongs to, when it has one. A test checks the collider does
   * not reach beyond that object's own bounds: a collider may be smaller than the thing it
   * guards (you can walk under a roof overhang) but must never block empty air.
   */
  for?: string;
};

export type Collider = BoxCollider;

/**
 * Solid volumes walk mode collides against, in world space — so they already include the
 * object's position and must be kept in step by hand when an object moves.
 * The clearing's own edges are not listed here; boundaryColliders() derives those.
 */
export const colliders: Collider[] = [
  // Plinth and walls only — the roof overhangs them by 0.3m and you can stand under it.
  { type: "box", center: [0, 1.9, -8.5], size: [5.2, 3, 4.2], for: "cabin" },
  { type: "box", center: [3.39, 0.93, -7.2], size: [1, 0.79, 1.58], for: "woodpile" },
];

export type SceneObject = {
  id: string;
  /** Name of the THREE.Group factory in src/objects/ that builds this object. */
  factory: string;
  position: [number, number, number];
  /** Y rotation in radians. */
  rotation?: number;
  /**
   * True when the object sits on the terrain, meaning position[1] must equal the ground
   * height there. A test enforces it, so editing terrainHeights under an object fails
   * loudly instead of leaving it hovering.
   */
  grounded?: boolean;
  /**
   * Key in `paths` for objects that move along a scripted route. A path takes over the
   * object's position entirely, so `position` is only where it sits before the first frame.
   */
  path?: string;
  /** Seconds for one full pass along `path`, before it loops. */
  pathSeconds?: number;
};

/** Every object in the Place, placed at a fixed position. */
export const objects: SceneObject[] = [
  { id: "cabin", factory: "createCabinModel", position: [0, 0.7, -8.5], grounded: true },
  {
    id: "woodpile",
    factory: "createWoodpileModel",
    position: [3.4, 0.5871, -7.2],
    rotation: Math.PI / 2,
    grounded: true,
  },
  {
    id: "plane",
    factory: "createPlaneModel",
    position: [150, 34, 130],
    path: "flyover",
    pathSeconds: 78,
  },
];

/**
 * Scripted routes, as plain point lists. Sampled with pointOnPath().
 *
 * The flyover starts and ends far outside the fog's reach, so the loop back to the first
 * point happens where nothing can be seen and never reads as a teleport.
 */
export const paths: Record<string, [number, number, number][]> = {
  flyover: [
    [150, 34, 130],
    [60, 36, 44],
    [-30, 40, -52],
    [-140, 46, -150],
  ],
};
