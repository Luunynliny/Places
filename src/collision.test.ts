import assert from "node:assert/strict";
import { test } from "node:test";
import { boundaryColliders, collidesAt, PLAYER_RADIUS, resolveMove } from "./collision.ts";
import { sceneBounds } from "./scene-data.ts";

const walls = boundaryColliders();

test("the clearing is walled on all four sides", () => {
  assert.equal(walls.length, 4);
});

test("the walls stop the player exactly one radius short of the bounds", () => {
  const { minX, maxX, minZ, maxZ } = sceneBounds;
  const inside = PLAYER_RADIUS + 0.01;
  const outside = PLAYER_RADIUS - 0.01;

  assert.equal(collidesAt(0, 0, walls), false);
  assert.equal(collidesAt(minX + inside, 0, walls), false);
  assert.equal(collidesAt(maxX - inside, 0, walls), false);
  assert.equal(collidesAt(0, minZ + inside, walls), false);
  assert.equal(collidesAt(0, maxZ - inside, walls), false);

  assert.equal(collidesAt(minX + outside, 0, walls), true);
  assert.equal(collidesAt(maxX - outside, 0, walls), true);
  assert.equal(collidesAt(0, minZ + outside, walls), true);
  assert.equal(collidesAt(0, maxZ - outside, walls), true);
});

test("corners are tested against the box, not its bounding square", () => {
  const box = [
    {
      type: "box" as const,
      center: [0, 1, 0] as [number, number, number],
      size: [2, 2, 2] as [number, number, number],
    },
  ];

  // Straight off a face, just inside and just outside reach.
  assert.equal(collidesAt(1 + PLAYER_RADIUS - 0.01, 0, box), true);
  assert.equal(collidesAt(1 + PLAYER_RADIUS + 0.01, 0, box), false);

  // Diagonally off the corner at the same per-axis offset: the true distance is
  // sqrt(2) times larger, so this must be clear rather than snagging.
  const offset = 1 + PLAYER_RADIUS - 0.01;
  assert.equal(collidesAt(offset, offset, box), false);
});

test("moving into a wall head-on stops, and does not tunnel through it", () => {
  const { maxZ } = sceneBounds;
  const start = maxZ - PLAYER_RADIUS - 0.05;
  assert.deepEqual(resolveMove(0, start, 0, 5, walls), [0, start]);
});

test("moving into a wall at an angle slides along it", () => {
  const { maxZ } = sceneBounds;
  const start = maxZ - PLAYER_RADIUS - 0.05;
  const [x, z] = resolveMove(0, start, 0.4, 5, walls);
  assert.equal(z, start, "blocked axis must not move");
  assert.equal(x, 0.4, "free axis must keep its full step");
});

test("an unobstructed move applies both axes", () => {
  assert.deepEqual(resolveMove(0, 0, 0.3, -0.2, walls), [0.3, -0.2]);
});
