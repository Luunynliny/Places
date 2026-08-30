import assert from "node:assert/strict";
import { test } from "node:test";
import { type Point, pointOnPath, sampleProfile } from "./path.ts";
import { weatherCycle, weatherCycleSeconds } from "./scene-data.ts";

const path: Point[] = [
  [0, 0, 0],
  [10, 2, 0],
  [10, 2, 20],
];

test("the ends of the path are its first and last points", () => {
  assert.deepEqual(pointOnPath(path, 0), [0, 0, 0]);
  assert.deepEqual(pointOnPath(path, 1), [10, 2, 20]);
});

test("t is shared evenly between segments, not by length", () => {
  // Two segments, so t=0.5 lands exactly on the middle knot even though the
  // second segment is twice as long as the first.
  assert.deepEqual(pointOnPath(path, 0.5), [10, 2, 0]);
});

test("positions inside a segment interpolate linearly", () => {
  assert.deepEqual(pointOnPath(path, 0.25), [5, 1, 0]);
  assert.deepEqual(pointOnPath(path, 0.75), [10, 2, 10]);
});

test("t outside 0-1 clamps to the ends rather than shooting off the path", () => {
  assert.deepEqual(pointOnPath(path, -3), [0, 0, 0]);
  assert.deepEqual(pointOnPath(path, 4), [10, 2, 20]);
});

test("degenerate paths return their only point instead of throwing", () => {
  assert.deepEqual(pointOnPath([[1, 2, 3]], 0.7), [1, 2, 3]);
  assert.deepEqual(pointOnPath([], 0.5), [0, 0, 0]);
});

test("sampleProfile reads values off an authored curve", () => {
  const curve: [number, number][] = [
    [0, 1],
    [10, 3],
    [30, 3],
  ];
  assert.equal(sampleProfile(curve, 0), 1);
  assert.equal(sampleProfile(curve, 5), 2);
  assert.equal(sampleProfile(curve, 10), 3);
  assert.equal(sampleProfile(curve, 20), 3);
});

test("sampleProfile holds flat past either end instead of extrapolating", () => {
  const curve: [number, number][] = [
    [10, 2],
    [20, 6],
  ];
  assert.equal(sampleProfile(curve, -100), 2);
  assert.equal(sampleProfile(curve, 9.9), 2);
  assert.equal(sampleProfile(curve, 1e6), 6);
});

test("sampleProfile survives empty and single-point curves", () => {
  assert.equal(sampleProfile([], 5), 0);
  assert.equal(sampleProfile([[3, 7]], 5), 7);
  assert.equal(sampleProfile([[3, 7]], 0), 7);
});

test("the weather cycle loops without a seam and never leaves 0-1", () => {
  const start = sampleProfile(weatherCycle, 0);
  const end = sampleProfile(weatherCycle, weatherCycleSeconds);
  assert.equal(start, end, "the cycle must end where it began or the loop jumps");
  assert.ok(start > 0, "the Place should never be dry on arrival");

  for (let t = 0; t <= weatherCycleSeconds; t += 1) {
    const value = sampleProfile(weatherCycle, t);
    assert.ok(value >= 0 && value <= 1, `intensity ${value} at ${t}s is outside 0-1`);
  }
});
