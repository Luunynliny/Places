import {
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { TREE_STRIDE, treeline } from "./scene-data.ts";
import { color, metalness, roughness } from "./style.ts";
import { sampleFarHeight } from "./terrain.ts";

/**
 * Three conifer shapes, differing in height and spread. Real geometry rather than the
 * spec's sprite billboards: sprites need a texture atlas we have no assets for, and at
 * this instance count solid cones cost nothing while reading far better against the sky.
 */
const VARIANTS = [
  { height: 6.4, radius: 1.5, tiers: 3 },
  { height: 4.8, radius: 1.9, tiers: 2 },
  { height: 8.1, radius: 1.3, tiers: 4 },
];

const TRUNK_RADIUS = 0.16;

function createTreeGeometry({ height, radius, tiers }: (typeof VARIANTS)[number]) {
  const trunkHeight = height * 0.28;
  const trunk = new CylinderGeometry(TRUNK_RADIUS, TRUNK_RADIUS * 1.5, trunkHeight, 5);
  trunk.translate(0, trunkHeight / 2, 0);

  const cones = [];
  const canopy = height - trunkHeight;
  for (let tier = 0; tier < tiers; tier++) {
    // Each tier is shorter and narrower than the one below, overlapping it slightly.
    const shrink = 1 - tier / (tiers + 0.6);
    const tierHeight = (canopy / tiers) * 1.5;
    const cone = new CylinderGeometry(0, radius * shrink, tierHeight, 7);
    cone.translate(0, trunkHeight + (canopy / tiers) * tier + tierHeight / 2, 0);
    cones.push(cone);
  }

  // Cones merged flat into one, then grouped against the trunk, so the result has exactly
  // two material groups: trunk first, needles second.
  const canopyGeometry = BufferGeometryUtils.mergeGeometries(cones, false);
  return BufferGeometryUtils.mergeGeometries([trunk, canopyGeometry], true);
}

/**
 * One InstancedMesh per variant, so the whole treeline is three draw calls.
 *
 * They deliberately cast no shadows. They sit outside the walkable bounds where a shadow
 * would only ever fall on the far shell, and 100 shadow casters is a real cost for
 * something nobody can walk up to.
 */
export function createTreeline(): InstancedMesh[] {
  const trunkBark = new MeshStandardMaterial({ color: color("timberDark"), roughness, metalness });
  const needles = new MeshStandardMaterial({ color: color("turf"), roughness, metalness });

  const byVariant = VARIANTS.map(() => [] as number[][]);
  for (let i = 0; i < treeline.length; i += TREE_STRIDE) {
    const variant = treeline[i + 4] ?? 0;
    byVariant[variant]?.push([
      treeline[i] ?? 0,
      treeline[i + 1] ?? 0,
      treeline[i + 2] ?? 1,
      treeline[i + 3] ?? 0,
    ]);
  }

  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const up = new Vector3(0, 1, 0);

  return VARIANTS.map((variant, index) => {
    const instances = byVariant[index] ?? [];
    const mesh = new InstancedMesh(
      createTreeGeometry(variant),
      // The trunk is the first merged part, so its material comes first.
      [trunkBark, needles],
      Math.max(instances.length, 1),
    );

    for (const [i, [x = 0, z = 0, size = 1, spin = 0]] of instances.entries()) {
      // Ground height is read from the terrain data, so the trees follow the land.
      position.set(x, sampleFarHeight(x, z), z);
      rotation.setFromAxisAngle(up, spin);
      scale.setScalar(size);
      mesh.setMatrixAt(i, matrix.compose(position, rotation, scale));
    }

    mesh.count = instances.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.name = `treeline-${index}`;
    return mesh;
  });
}
