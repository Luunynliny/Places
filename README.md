# Places

Small, bounded, hand-authored 3D scenes you can walk through slowly or fly around freely.
A Place is fixed: the terrain, the walls and every object sit where they were authored, and
stay there. Only object *movement* and *weather* change while you are inside.

Build spec: [`places-build-spec.md`](places-build-spec.md).

## Getting started

```bash
npm install
npm run dev
```

Click the canvas to capture the pointer. `WASD` to move, `V` to switch between walking and
flying, `Esc` to release. Flying adds `Q`/`E` for down/up and `Shift` to speed up.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run check` | Biome lint + format check |
| `npm run format` | Biome, writing fixes |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Node's built-in test runner over `src/**/*.test.ts` |

## Status

Phase 4: the Place is a **cabin clearing** - 24x24m of authored terrain with a packed path
running north to a lit cabin on a rocky rise, a woodpile against its east wall, a small plane
crossing the sky on a scripted route with its engine audible as it passes, and rising
ground fading into haze at the edges. You can walk it at a
deliberate 1.2 m/s, pinned to the ground and stopped by the cabin, the woodpile and the
clearing edge, or switch to free-cam and fly through everything.

Weather lands in phases 5-6 - see the build spec's milestones.

### The ambient bed

The clearing's base layer - wind through wet conifers, no events - is the one sound worth
generating rather than synthesising. [`docs/sound-palette.json`](docs/sound-palette.json)
holds the exact prompt to hand an AI soundscape tool, derived from the same mood adjectives
as the visual style guide. Export a seamless WAV to `public/audio/ambient-bed.wav` and flip
`ambientBed.present` to `true`; nothing tries to load it until then, so a missing file never
shows up as a console error.

The plane's engine needs no file: it is synthesised live and fed through
`THREE.PositionalAudio`, so it pans and attenuates with the aircraft and has no loop seam.

### Adding an object

Objects live in `src/objects/` as `THREE.Group` factories and are placed by name in
`src/scene-data.ts`. Colours come from [`docs/style-guide.json`](docs/style-guide.json), the
shared palette the specialist agents read, so nothing can drift from it by accident. See the
`place-authoring` skill for the conventions, and note that swapping an object's look later is
a one-line `factory` change in the data.

## Contributing

Branch from `develop`, use [Conventional Commits](https://www.conventionalcommits.org/),
open a PR back into `develop`. Releases are cut by merging `develop` into `main`. See
[`CLAUDE.md`](CLAUDE.md) for the full workflow.
