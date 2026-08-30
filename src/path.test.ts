import assert from "node:assert/strict";
import { test } from "node:test";
import { type Point, pointOnPath } from "./path.ts";

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
