import assert from "node:assert/strict";
import { test } from "node:test";
import { Color } from "three";
import { farProfile } from "./scene-data.ts";
import { sampleFarHeight, sampleHeight, sampleSurfaceColor } from "./terrain.ts";

const close = (actual: number, expected: number, tolerance = 1e-9) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );

test("sampleHeight returns the authored value at a grid node", () => {
  // x=0, z=-9 is row 1, column 4 of terrainHeights.
  close(sampleHeight(0, -9), 0.72);
});

test("sampleHeight blends linearly between nodes", () => {
  // Halfway between (0, -9) = 0.72 and (0, -6) = 0.6.
  close(sampleHeight(0, -7.5), 0.66);
});

test("the clearing border is flat so it meets the far shell without a step", () => {
  for (const [x, z] of [
    [-12, 0],
    [12, 0],
    [0, -12],
    [0, 12],
    [-12, -12],
  ] as const) {
    close(sampleHeight(x, z), 0);
    close(sampleFarHeight(x, z), 0);
  }
});

test("sampling outside the clearing clamps to the border rather than extrapolating", () => {
  close(sampleHeight(1000, 1000), 0);
  close(sampleHeight(-1000, 4), 0);
});

test("sampleFarHeight rises with Chebyshev distance, so its rings stay square", () => {
  close(sampleFarHeight(0, 0), 0);
  close(sampleFarHeight(18, 0), sampleFarHeight(0, 18));
  close(sampleFarHeight(18, 5), sampleFarHeight(18, -18));
  // Past the last profile entry the height holds rather than extrapolating upward.
  const [furthest, highest] = farProfile[farProfile.length - 1] ?? [0, 0];
  close(sampleFarHeight(furthest, 0), highest);
  close(sampleFarHeight(furthest * 50, 0), highest);
  assert.ok(sampleFarHeight(35, 0) > sampleFarHeight(18, 0));
});

test("sampleSurfaceColor writes into the target and blends between surfaces", () => {
  const target = new Color();
  const returned = sampleSurfaceColor(0, 12, target);
  assert.equal(returned, target);

  // On the south edge, x=-3 sits on a path node and x=-6 on a litter node.
  // A point between the two must be neither.
  const path = sampleSurfaceColor(-3, 12, new Color()).getHex();
  const litter = sampleSurfaceColor(-6, 12, new Color()).getHex();
  const between = sampleSurfaceColor(-4.5, 12, new Color()).getHex();
  assert.notEqual(path, litter);
  assert.notEqual(between, path);
  assert.notEqual(between, litter);
});
