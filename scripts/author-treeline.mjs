// Run once at authoring time. Its output is pasted into scene-data.ts as fixed data;
// nothing about the treeline is decided at runtime.
const ROWS = [12.9, 15.8, 19.2, 23.5, 28.6, 34.5];
// Spacing opens up with distance: the far rows only have to read as forest, not as trees.
const SPACING = (depth) => 3.4 * (1 + depth / 46);
const JITTER = 0.8;
const VARIANTS = 3;

// The path leaves the clearing to the south. The near rows keep the gap open so it reads
// as a corridor rather than a notch in a wall, but the furthest row closes across it, so
// looking down the path you see it bend into the trees instead of the edge of the world.
const CORRIDOR_CLOSES_AT = 30;
const inGateway = (x, z, depth) => depth < CORRIDOR_CLOSES_AT && z > 10 && Math.abs(x) < 3.4;

const out = [];
for (const [rowIndex, depth] of ROWS.entries()) {
  const perSide = Math.round((depth * 2) / SPACING(depth));
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < perSide; i++) {
      // Half-spacing offset per row so the rows read as staggered, not as a grid.
      const along = -depth + ((i + 0.5 + (rowIndex % 2) * 0.5) / perSide) * depth * 2;
      const jx = (Math.random() - 0.5) * 2 * JITTER;
      const jz = (Math.random() - 0.5) * 2 * JITTER;
      const [x, z] =
        side === 0
          ? [along + jx, -depth + jz]
          : side === 1
            ? [along + jx, depth + jz]
            : side === 2
              ? [-depth + jx, along + jz]
              : [depth + jx, along + jz];

      if (inGateway(x, z, depth)) continue;
      if (Math.max(Math.abs(x), Math.abs(z)) < 12.4) continue; // never inside the clearing

      out.push([
        Number(x.toFixed(2)),
        Number(z.toFixed(2)),
        Number((0.72 + Math.random() * 0.66).toFixed(2)),
        Number((Math.random() * Math.PI * 2).toFixed(2)),
        Math.floor(Math.random() * VARIANTS),
      ]);
    }
  }
}

const lines = [];
for (let i = 0; i < out.length; i += 3) {
  lines.push(
    "  " +
      out
        .slice(i, i + 3)
        .map((t) => t.join(", "))
        .join(",  ") +
      ",",
  );
}
console.log(`// ${out.length} trees, stride 5`);
console.log(lines.join("\n"));
