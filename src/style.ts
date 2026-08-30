import styleGuide from "../docs/style-guide.json" with { type: "json" };

export const mood: readonly string[] = styleGuide.mood;

/**
 * The shared palette, as Three.js-ready hex numbers. Object code reads colours from here
 * rather than writing its own, so hand-built objects cannot drift from the style guide.
 */
export const palette: Record<string, number> = Object.fromEntries(
  Object.entries(styleGuide.palette).map(([name, hex]) => [
    name,
    Number.parseInt(hex.slice(1), 16),
  ]),
);

/** Look up a palette colour, failing loudly rather than silently rendering the wrong thing. */
export function color(name: keyof typeof styleGuide.palette): number {
  const value = palette[name];
  if (value === undefined) throw new Error(`No "${name}" in docs/style-guide.json palette`);
  return value;
}

export const { roughness, metalness } = styleGuide.materials;
