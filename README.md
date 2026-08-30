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

Phase 2: the Place is a **cabin clearing** - 24x24m of authored terrain with a packed path
running north to a rocky rise, enclosed by rising ground that fades into haze. You can walk it
at a deliberate 1.2 m/s, pinned to the ground and stopped at the edges, or switch to free-cam
and fly through everything. Objects, audio and weather land in phases 3-6 - see the build
spec's milestones.

## Contributing

Branch from `develop`, use [Conventional Commits](https://www.conventionalcommits.org/),
open a PR back into `develop`. Releases are cut by merging `develop` into `main`. See
[`CLAUDE.md`](CLAUDE.md) for the full workflow.
