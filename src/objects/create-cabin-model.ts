import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Shape, ShapeGeometry } from "three";
import { color, metalness, roughness } from "../style.ts";

const WIDTH = 5;
const DEPTH = 4;
const WALL_HEIGHT = 2.4;
const PLINTH_HEIGHT = 0.6;
const ROOF_RISE = 1.6;
const ROOF_OVERHANG = 0.3;

const EAVES = PLINTH_HEIGHT / 2 + WALL_HEIGHT;
const RIDGE = EAVES + ROOF_RISE;
const RUN = WIDTH / 2 + ROOF_OVERHANG;
const SLOPE_LENGTH = Math.hypot(RUN, ROOF_RISE);
const SLOPE_ANGLE = Math.atan2(ROOF_RISE, RUN);

const surface = (hex: number, emissive = 0) =>
  new MeshStandardMaterial({ color: hex, roughness, metalness, emissive });

function box(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  material: MeshStandardMaterial,
) {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** The triangle of wall between the eaves and the ridge, at one gable end. */
function gableFill(z: number, material: MeshStandardMaterial) {
  const shape = new Shape();
  shape.moveTo(-WIDTH / 2, EAVES);
  shape.lineTo(WIDTH / 2, EAVES);
  shape.lineTo(0, RIDGE);
  shape.closePath();
  const mesh = new Mesh(new ShapeGeometry(shape), material);
  mesh.position.z = z;
  if (z < 0) mesh.rotation.y = Math.PI;
  mesh.castShadow = true;
  return mesh;
}

/**
 * The cabin on the north rise: timber walls on a stone plinth, gabled roof with its ridge
 * running north-south so the gable end faces anyone walking up the path, stone chimney on
 * the west side, and two lit windows as the Place's only warm colour.
 *
 * ponytail: exterior only, so its collider is one footprint box rather than four walls with
 * a doorway gap. Split it the moment there is an interior worth walking into.
 */
export function createCabinModel(): Group {
  const group = new Group();
  const timber = surface(color("timber"));
  const timberDark = surface(color("timberDark"));
  const roofing = surface(color("roof"));
  const stone = surface(color("stone"));
  const litWindow = surface(color("lampGlow"), color("lampGlow"));

  group.add(box(WIDTH + 0.2, PLINTH_HEIGHT, DEPTH + 0.2, 0, 0, 0, stone));
  group.add(box(WIDTH, WALL_HEIGHT, DEPTH, 0, PLINTH_HEIGHT / 2 + WALL_HEIGHT / 2, 0, timber));

  for (const side of [1, -1]) {
    const slope = box(
      SLOPE_LENGTH,
      0.14,
      DEPTH + 0.6,
      (side * RUN) / 2,
      (EAVES + RIDGE) / 2,
      0,
      roofing,
    );
    slope.rotation.z = -side * SLOPE_ANGLE;
    group.add(slope);
    group.add(gableFill(side * (DEPTH / 2 + 0.01), timber));
  }

  // South face: the door and two windows you see coming up the path.
  group.add(box(1, 2, 0.12, 0, PLINTH_HEIGHT / 2 + 1, DEPTH / 2 + 0.02, timberDark));
  for (const side of [1, -1]) {
    group.add(box(0.9, 0.8, 0.1, side * 1.6, PLINTH_HEIGHT / 2 + 1.6, DEPTH / 2 + 0.02, litWindow));
  }

  group.add(box(0.7, RIDGE + 0.9, 0.7, -(WIDTH / 2 - 0.5), (RIDGE + 0.9) / 2, -0.8, stone));

  group.name = "cabin";
  return group;
}
