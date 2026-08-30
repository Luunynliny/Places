import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { color, metalness, roughness } from "../style.ts";

/**
 * A small high-wing aircraft, nose pointing down +Z. That is Object3D.lookAt()'s convention
 * for anything that is not a camera or a light - it points +Z at the target, not -Z - so a
 * model built nose-first along +Z flies forwards along its path without a correction.
 *
 * Only ever seen at distance and against the sky, so it is built from the silhouette cues
 * that read at that range and nothing else.
 */
export function createPlaneModel(): Group {
  const group = new Group();
  const shell = new MeshStandardMaterial({ color: color("metal"), roughness, metalness });
  const trim = new MeshStandardMaterial({ color: color("metalDark"), roughness, metalness });

  const fuselage = new Mesh(new CylinderGeometry(0.34, 0.22, 4.4, 10), shell);
  fuselage.rotation.x = Math.PI / 2;
  group.add(fuselage);

  const wing = new Mesh(new BoxGeometry(9, 0.12, 1.3), shell);
  wing.position.set(0, 0.42, 0.2);
  group.add(wing);

  const tailplane = new Mesh(new BoxGeometry(3, 0.1, 0.7), shell);
  tailplane.position.set(0, 0.1, -1.9);
  group.add(tailplane);

  const fin = new Mesh(new BoxGeometry(0.1, 1, 0.8), shell);
  fin.position.set(0, 0.62, -1.95);
  group.add(fin);

  // Struts from the wing down to the fuselage sides, the giveaway of a high-wing aircraft.
  for (const side of [1, -1]) {
    const strut = new Mesh(new BoxGeometry(0.07, 1.1, 0.07), trim);
    strut.position.set(side * 1.5, 0.05, 0.2);
    strut.rotation.z = side * 0.5;
    group.add(strut);
  }

  const spinner = new Mesh(new CylinderGeometry(0.16, 0.05, 0.4, 8), trim);
  spinner.rotation.x = Math.PI / 2;
  spinner.position.z = 2.3;
  group.add(spinner);

  const propeller = new Mesh(new BoxGeometry(2.2, 0.14, 0.05), trim);
  propeller.position.z = 2.45;
  propeller.name = "propeller";
  group.add(propeller);

  for (const child of group.children) child.castShadow = true;

  group.name = "plane";
  return group;
}
