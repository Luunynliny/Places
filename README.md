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

Click the canvas to capture the pointer. `WASD` to move, `Q`/`E` for down/up, `Shift` to
speed up, `Esc` to release.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run check` | Biome lint + format check |
| `npm run format` | Biome, writing fixes |
| `npm run typecheck` | `tsc --noEmit` |

## Status

Phase 0: project scaffold, free-cam 3D shell, CI, and automated releases. The Place itself
(terrain, walk mode, objects, audio, weather) lands in phases 1-6 - see the build spec's
milestones.

## Contributing

Branch from `develop`, use [Conventional Commits](https://www.conventionalcommits.org/),
open a PR back into `develop`. Releases are cut by merging `develop` into `main`. See
[`CLAUDE.md`](CLAUDE.md) for the full workflow.
