import { BufferAttribute, Color, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";
import { sampleProfile } from "./path.ts";
import {
  farProfile,
  sceneBounds,
  surfaceGrid,
  surfacePalette,
  terrainHeights,
} from "./scene-data.ts";

const NEAR_SEGMENTS = 48;
const FAR_EXTENT = 400;
const FAR_SEGMENTS = 64;
/** The far shell sits just under the clearing so the two never z-fight where they overlap. */
const FAR_DROP = 0.02;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Grid coordinates for a world position: fractional row/column into the authored
 * grids, clamped to the clearing so sampling outside returns the border value.
 */
function gridCoords(x: number, z: number, rows: number, cols: number) {
  const { minX, maxX, minZ, maxZ } = sceneBounds;
  const u = clamp01((x - minX) / (maxX - minX)) * (cols - 1);
  const v = clamp01((z - minZ) / (maxZ - minZ)) * (rows - 1);
  const col = Math.min(Math.floor(u), cols - 2);
  const row = Math.min(Math.floor(v), rows - 2);
  return { row, col, tx: u - col, tz: v - row };
}

/** Ground height at a world position, bilinear between the authored grid nodes. */
export function sampleHeight(x: number, z: number): number {
  const rows = terrainHeights.length;
  const cols = terrainHeights[0]?.length ?? 0;
  const { row, col, tx, tz } = gridCoords(x, z, rows, cols);
  const at = (r: number, c: number) => terrainHeights[r]?.[c] ?? 0;
  return lerp(
    lerp(at(row, col), at(row, col + 1), tx),
    lerp(at(row + 1, col), at(row + 1, col + 1), tx),
    tz,
  );
}

/** Surface colour at a world position, blended the same way as the height. */
export function sampleSurfaceColor(x: number, z: number, target: Color): Color {
  const rows = surfaceGrid.length;
  const cols = surfaceGrid[0]?.length ?? 0;
  const { row, col, tx, tz } = gridCoords(x, z, rows, cols);
  const at = (r: number, c: number) =>
    new Color(surfacePalette[surfaceGrid[r]?.[c] ?? "g"] ?? 0xff00ff);
  const north = at(row, col).lerp(at(row, col + 1), tx);
  const south = at(row + 1, col).lerp(at(row + 1, col + 1), tx);
  return target.copy(north).lerp(south, tz);
}

/**
 * Height of the land beyond the clearing. Chebyshev distance, not Euclidean, so the
 * profile's contours are square rings that match the square clearing instead of rising
 * over its corners and pushing through the near mesh.
 */
export function sampleFarHeight(x: number, z: number): number {
  return sampleProfile(farProfile, Math.max(Math.abs(x), Math.abs(z)));
}

/**
 * Displace a ground plane's vertices by `height`. The plane is built in XY and rotated
 * -90° about X, which sends vertex (x, y, z) to world (x, z, -y) — so the vertex's own
 * z becomes world height, and world Z is the negated vertex y.
 */
function displace(geometry: PlaneGeometry, height: (x: number, z: number) => number) {
  const position = geometry.attributes.position as BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    position.setZ(i, height(position.getX(i), -position.getY(i)));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

/** The walkable clearing: fine grid, authored relief, blended surface, takes shadows. */
export function createNearTerrain(): Mesh {
  const width = sceneBounds.maxX - sceneBounds.minX;
  const depth = sceneBounds.maxZ - sceneBounds.minZ;
  const geometry = new PlaneGeometry(width, depth, NEAR_SEGMENTS, NEAR_SEGMENTS);
  displace(geometry, sampleHeight);

  const position = geometry.attributes.position as BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const color = new Color();
  for (let i = 0; i < position.count; i++) {
    sampleSurfaceColor(position.getX(i), -position.getY(i), color);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));

  const mesh = new Mesh(geometry, new MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.name = "near-terrain";
  return mesh;
}

/**
 * Everything past the clearing edge: coarse grid, no shadows, one flat colour that the
 * fog does most of the work on. Detail effort goes where the player can actually get close.
 *
 * ponytail: one flat colour, so the enclosing slope reads as a featureless band above the
 * treeline height. Instanced treeline foliage along the clearing edge is what breaks that
 * silhouette up; add it when the edge starts looking wrong rather than merely plain.
 */
export function createFarShell(): Mesh {
  const geometry = new PlaneGeometry(FAR_EXTENT, FAR_EXTENT, FAR_SEGMENTS, FAR_SEGMENTS);
  displace(geometry, sampleFarHeight);

  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: 0x6f7d61, roughness: 1 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -FAR_DROP;
  mesh.name = "far-shell";
  return mesh;
}
