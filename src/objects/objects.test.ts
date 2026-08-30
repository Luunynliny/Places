import assert from "node:assert/strict";
import { test } from "node:test";
import { Box3, Vector3 } from "three";
import { colliders, objects, paths, TREE_STRIDE, treeline } from "../scene-data.ts";
import { palette } from "../style.ts";
import { sampleHeight } from "../terrain.ts";
import { buildObjects, factories } from "./index.ts";

test("every object names a factory that exists", () => {
  for (const entry of objects) {
    assert.ok(factories[entry.factory], `"${entry.id}" names missing factory "${entry.factory}"`);
  }
});

test("object ids are unique, since colliders and audio refer to them", () => {
  const ids = objects.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("grounded objects sit on the terrain rather than hovering or sinking", () => {
  for (const entry of objects.filter((o) => o.grounded)) {
    const [x, y, z] = entry.position;
    const ground = sampleHeight(x, z);
    assert.ok(
      Math.abs(y - ground) < 0.001,
      `"${entry.id}" is at y=${y} but the ground there is ${ground.toFixed(4)}`,
    );
  }
});

test("every collider sits inside the clearing it is meant to be part of", () => {
  for (const collider of colliders) {
    const [x, , z] = collider.center;
    assert.ok(
      Math.abs(x) <= 12 && Math.abs(z) <= 12,
      `collider at ${x}, ${z} is outside the bounds`,
    );
  }
});

test("buildObjects places each group at its authored position", () => {
  const built = buildObjects();
  assert.equal(built.length, objects.length);
  for (const [i, group] of built.entries()) {
    const entry = objects[i];
    assert.ok(entry);
    assert.equal(group.name, entry.id);
    assert.deepEqual(group.position.toArray(), entry.position);
    assert.equal(group.rotation.y, entry.rotation ?? 0);
    assert.ok(group.children.length > 0, `"${entry.id}" built an empty group`);
  }
});

test("objects draw their colours from the shared palette, so they cannot drift", () => {
  const known = new Set(Object.values(palette));
  for (const group of buildObjects()) {
    group.traverse((node) => {
      if (!("material" in node)) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (material && "color" in material) {
          assert.ok(
            known.has(material.color.getHex()),
            `${group.name} uses #${material.color.getHexString()}, which is not in the style guide`,
          );
        }
      }
    });
  }
});

test("no collider reaches beyond the object it guards, so none blocks empty air", () => {
  const bounds = new Map(
    buildObjects().map((group) => {
      group.updateMatrixWorld(true);
      return [group.name, new Box3().setFromObject(group)];
    }),
  );

  for (const collider of colliders.filter((c) => c.for)) {
    const box = bounds.get(String(collider.for));
    assert.ok(box, `collider names object "${collider.for}", which is not in the scene`);
    const [cx, , cz] = collider.center;
    const [sx, , sz] = collider.size;
    // A hair of tolerance, since a collider tightened to a measured extent lands on it.
    const slack = 0.005;
    assert.ok(cx - sx / 2 >= box.min.x - slack, `${collider.for} collider overhangs to the west`);
    assert.ok(cx + sx / 2 <= box.max.x + slack, `${collider.for} collider overhangs to the east`);
    assert.ok(cz - sz / 2 >= box.min.z - slack, `${collider.for} collider overhangs to the north`);
    assert.ok(cz + sz / 2 <= box.max.z + slack, `${collider.for} collider overhangs to the south`);
  }
});

test("every collider that guards an object covers most of its footprint", () => {
  const built = new Map(buildObjects().map((group) => [group.name, group]));
  for (const collider of colliders.filter((c) => c.for)) {
    const group = built.get(String(collider.for));
    assert.ok(group);
    group.updateMatrixWorld(true);
    const size = new Box3().setFromObject(group).getSize(new Vector3());
    const [sx, , sz] = collider.size;
    const covered = (sx * sz) / (size.x * size.z);
    assert.ok(covered > 0.6, `${collider.for} collider covers only ${(covered * 100).toFixed(0)}%`);
  }
});

test("objects that follow a path name one that exists and is actually a route", () => {
  for (const entry of objects.filter((o) => o.path)) {
    const path = paths[String(entry.path)];
    assert.ok(path, `"${entry.id}" follows path "${entry.path}", which is not defined`);
    assert.ok(path.length >= 2, `path "${entry.path}" needs at least two points to be a route`);
    assert.ok((entry.pathSeconds ?? 0) > 0, `"${entry.id}" needs a positive pathSeconds`);
  }
});

test("a path-driven object is not also pinned to the ground", () => {
  for (const entry of objects.filter((o) => o.path)) {
    assert.ok(!entry.grounded, `"${entry.id}" cannot both follow a path and sit on the terrain`);
  }
});

test("a plane pointed along its path flies nose-first, not tail-first", () => {
  const plane = factories.createPlaneModel?.();
  assert.ok(plane, "there is no plane factory to check");

  const target = new Vector3(0, 0, 100);
  plane.position.set(0, 0, 0);
  plane.lookAt(target);
  plane.updateMatrixWorld(true);

  const propeller = plane.getObjectByName("propeller");
  assert.ok(propeller, "the plane has no propeller to orient by");
  const nose = propeller.getWorldPosition(new Vector3());

  // Object3D.lookAt() points +Z at the target for anything that is not a camera or light,
  // so a model built nose-toward--Z would put the propeller on the far side from travel.
  assert.ok(
    nose.distanceTo(target) < plane.position.distanceTo(target),
    `the propeller ended up behind the aircraft: it is at z=${nose.z.toFixed(2)}`,
  );
});

test("the treeline is well-formed and stays outside the walkable clearing", () => {
  assert.equal(treeline.length % TREE_STRIDE, 0, "the flat array must divide by its stride");
  assert.ok(treeline.length > 0, "there is no treeline");

  for (let i = 0; i < treeline.length; i += TREE_STRIDE) {
    const [x, z, scale, , variant] = treeline.slice(i, i + TREE_STRIDE);
    assert.ok(x !== undefined && z !== undefined);
    assert.ok(
      Math.max(Math.abs(x), Math.abs(z)) > 12,
      `a tree at ${x}, ${z} stands inside the clearing, where nothing stops you walking into it`,
    );
    assert.ok((scale ?? 0) > 0, "a tree has no size");
    assert.ok(Number.isInteger(variant) && (variant ?? -1) >= 0, "a tree has an invalid variant");
  }
});

test("the path out of the clearing reads as a corridor, open near and closed far", () => {
  let closesTheFarEnd = false;

  for (let i = 0; i < treeline.length; i += TREE_STRIDE) {
    const x = treeline[i] ?? 0;
    const z = treeline[i + 1] ?? 0;
    if (Math.abs(x) >= 3.4) continue;

    if (z > 10 && z < 30) {
      assert.fail(`a tree at ${x}, ${z} blocks the corridor where it should still be open`);
    }
    if (z >= 30) closesTheFarEnd = true;
  }

  assert.ok(
    closesTheFarEnd,
    "nothing closes the far end of the corridor, so the path runs out to the edge of the world",
  );
});
