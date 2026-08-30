import type { Group } from "three";
import { objects } from "../scene-data.ts";
import { createCabinModel } from "./create-cabin-model.ts";
import { createPlaneModel } from "./create-plane-model.ts";
import { createWoodpileModel } from "./create-woodpile-model.ts";

/**
 * Factory name -> builder. The `factory` string in scene-data is the only link between
 * an object's placement and its look, so swapping how something looks is a one-line
 * change in the data rather than an edit to render code.
 */
export const factories: Record<string, () => Group> = {
  createCabinModel,
  createPlaneModel,
  createWoodpileModel,
};

/** Build every object in scene-data at its authored position. */
export function buildObjects(): Group[] {
  return objects.map((entry) => {
    const factory = factories[entry.factory];
    if (!factory) {
      throw new Error(
        `Object "${entry.id}" names factory "${entry.factory}", which does not exist`,
      );
    }
    const group = factory();
    group.position.set(...entry.position);
    group.rotation.y = entry.rotation ?? 0;
    group.name = entry.id;
    return group;
  });
}
