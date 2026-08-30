---
name: place-authoring
description: Use when placing, moving, or removing anything in a Place - registering a generated object in scene-data.ts, adding a collider, authoring a scripted path, or wiring a new object factory. Covers the conventions the specialist agents deliberately don't own.
---

# Place authoring

A Place is fixed data plus a renderer that reads it. Layout lives in `src/scene-data.ts`
and nowhere else. If a position, size, or route ends up hardcoded in render code, it is a bug.

## The one rule

`src/scene-data.ts` never imports Three.js. It is plain arrays and objects, readable
without a renderer. That is what keeps collision, bounds, and later edits cheap.

## Registering a generated object

img2threejs emits a `THREE.Group` factory. Wire it in three steps:

1. Drop the file in `src/objects/`, named after its factory in kebab-case:
   `createCabinModel` → `src/objects/create-cabin-model.ts`, default export or named,
   matching the factory name exactly. The `factory` string in scene-data is the lookup key.
2. Add an entry to `objects`:
   ```ts
   { id: "cabin", factory: "createCabinModel", position: [0, 0, -6], rotation: 0 }
   ```
   `id` is unique and stable - it is how you refer to the object from audio, paths,
   and the style-guide registry. Never renumber ids to tidy them up.
3. Add its colliders (below). An object with no collider is scenery you can walk through.

## Colliders

Boxes only. Derive them from the generated group's bounding box, then hand-tighten:

- One box per solid surface, not one box per model. A cabin is four walls, not a cube -
  otherwise you can't walk inside it.
- `center` is world-space, so it already includes the object's `position`. Keep them in
  sync by hand when an object moves; there is no automatic derivation on purpose.
- `size` is full extents, not half-extents. Walk mode adds `PLAYER_RADIUS` itself.
- Y is ignored by the current 2D collision check. Fill it in accurately anyway - it costs
  nothing and a future step-up/crouch check will want it.

`sceneBounds` is the outer shell and needs no explicit collider; walk mode clamps to it.

## Scripted paths

Routes are plain point lists in `paths`, sampled by `pointOnPath(path, t)` with `t` in 0-1:

```ts
paths.takeoffPath = [
  [40, 0, -50],   // taxi start
  [10, 0, -50],   // runway threshold
  [-20, 2, -48],  // rotation, y starts rising
  [-60, 15, -40], // climbing away
];
```

Reference it from the object with `path: "takeoffPath"`. Straight lerp between points is
the intended behaviour - it is enough for one plane crossing a clearing. Reach for
`THREE.CatmullRomCurve3` only when faceted cornering is actually visible.

## What not to do here

- Don't generate object geometry - that's `object-modeler`.
- Don't pick colours or materials - that's `style-colorist` and `docs/style-guide.json`.
- Don't add anything that varies per session. No `Math.random()` in scene data, ever.
  A variant chosen at authoring time gets written down as a fixed value.
