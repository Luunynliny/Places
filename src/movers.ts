import type { Group } from "three";
import { Vector3 } from "three";
import { pointOnPath } from "./path.ts";
import { objects, paths } from "./scene-data.ts";

/** How far ahead to sample for the direction an object should face. */
const LOOK_AHEAD = 0.004;

type Mover = { group: Group; path: readonly [number, number, number][]; seconds: number };

/**
 * Advances every object that scene-data gave a path. Each keeps its own progress, so
 * adding a second vehicle needs nothing here beyond another entry in the data.
 */
export function createMovers(groups: readonly Group[]) {
  const byId = new Map(groups.map((group) => [group.name, group]));
  const movers: Mover[] = [];

  for (const entry of objects) {
    if (!entry.path) continue;
    const group = byId.get(entry.id);
    const path = paths[entry.path];
    if (!group || !path) continue;
    movers.push({ group, path, seconds: entry.pathSeconds ?? 60 });
  }

  const progress = movers.map(() => 0);
  const ahead = new Vector3();

  return {
    count: movers.length,
    update(delta: number) {
      for (const [i, mover] of movers.entries()) {
        const t = ((progress[i] ?? 0) + delta / mover.seconds) % 1;
        progress[i] = t;
        mover.group.position.set(...pointOnPath(mover.path, t));
        ahead.set(...pointOnPath(mover.path, Math.min(t + LOOK_AHEAD, 1)));
        // At the very end of the path the look-ahead point is the current one; leaving the
        // last orientation alone beats pointing the nose at an undefined direction.
        if (!ahead.equals(mover.group.position)) mover.group.lookAt(ahead);
      }
    },
  };
}
