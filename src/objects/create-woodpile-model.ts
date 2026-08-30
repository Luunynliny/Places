import { CylinderGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { color, metalness, roughness } from "../style.ts";

const LOG_RADIUS = 0.12;
const LOG_LENGTH = 1.6;

/**
 * Each log's row, slot and slight roll, authored once rather than rolled at runtime.
 * The top row is deliberately short — a pile someone has been working through.
 */
const LOGS: [row: number, slot: number, roll: number][] = [
  [0, 0, 0.2],
  [0, 1, -0.4],
  [0, 2, 0.9],
  [0, 3, 0.1],
  [1, 0.5, -0.7],
  [1, 1.5, 0.35],
  [1, 2.5, 1.2],
  [2, 1, 0.6],
  [2, 2, -0.15],
];

/** A stack of split logs against the cabin's east wall. */
export function createWoodpileModel(): Group {
  const group = new Group();
  const bark = new MeshStandardMaterial({ color: color("timberDark"), roughness, metalness });
  const cut = new MeshStandardMaterial({ color: color("timber"), roughness, metalness });
  const geometry = new CylinderGeometry(LOG_RADIUS, LOG_RADIUS, LOG_LENGTH, 8);

  for (const [row, slot, roll] of LOGS) {
    // Cylinder caps are the sawn ends, so the cut material goes on the second group.
    const log = new Mesh(geometry, [bark, cut, cut]);
    log.rotation.set(0, 0, Math.PI / 2);
    log.rotation.x = roll;
    log.position.set(0, LOG_RADIUS + row * LOG_RADIUS * 1.9, (slot - 1.5) * LOG_RADIUS * 2.1);
    log.castShadow = true;
    log.receiveShadow = true;
    group.add(log);
  }

  group.name = "woodpile";
  return group;
}
