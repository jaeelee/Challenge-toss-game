# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, etc.) working in this repository.

## Project overview

Liquid Blocks (워터 소트 퍼즐) is a Water Sort Puzzle game built with React 19 + TypeScript + Vite (rolldown-vite). Players move colored liquid between bottles to sort each bottle into a single color.

## Commands

```bash
yarn dev       # start dev server (vite)
yarn build     # type-check (tsc -b) then production build
yarn lint      # eslint .
yarn preview   # preview production build
```

There is no test suite configured in this repo.

## Import convention (important, enforced by ESLint)

All imports of project source must use **absolute paths rooted at `/`** (mapping to `src/`), not relative paths. `eslint.config.js` has a `no-restricted-imports` rule that errors on `./` and `../` imports.

```ts
// correct
import type { Puzzle } from '/entities/game';
import { Board } from '/pages/game-board/ui/board';

// wrong — will fail lint
import { Board } from '../game-board/ui/board';
```

This works via two matching configs that must stay in sync:
- `vite.config.ts` — a regex alias that rewrites `/entities`, `/pages`, `/shared`, `/assets`, `/App.css`, `/main.tsx`, `/App` to `src/...` (careful to exclude real filesystem absolute paths).
- `tsconfig.app.json` — `paths: { "/*": ["./*"] }` with `baseUrl: "src"`.

If you add a new top-level directory under `src/` (alongside `entities`, `pages`, `shared`, `assets`), add it to the vite alias regex or imports from it will resolve incorrectly at runtime despite type-checking fine.

Note: `src/pages/home/index.tsx` currently uses relative imports (`./ui/home`, `../../assets/...`) — this is a pre-existing inconsistency, not the pattern to follow for new code.

## Architecture

Feature-sliced-ish layout under `src/`:

- **`entities/game/`** — core domain: `model/types.ts` (`Puzzle`/`Bottle`/`Color`/`GameState`/`Difficulty`), `model/storage.ts` (localStorage persistence of the in-progress game under key `current_game`), `lib/constants.ts` (`DIFFICULTY_CONFIG`, `COLOR` palette). Re-exported via `entities/game/index.ts`.
- **`pages/home/`** — landing page; `lib/hooks.ts` handles new-game / continue-game flow, navigating to `/game` with puzzle + settings passed via router `location.state`.
- **`pages/game-board/`** — the actual gameplay page (`ui/board.tsx`, `ui/bottle.tsx`) plus game logic in `lib/`:
  - `game-logic.ts` — `LiquidMover` (validates/executes single moves, computes legal moves, checks completion) wrapped by `GameAPI`, which is what `Board` consumes.
  - `game-generator.ts` — `WaterSortPuzzleGenerator` / `PuzzleGeneratorAPI` produce a shuffled-but-valid puzzle (equal counts per color, minimum empty bottles) by direct randomization + validation rather than reverse-shuffling a solved state.
  - `difficulty-manager.ts` — `DifficultyManager` singleton controlling which liquid positions are visible per `Difficulty` (`easy` = all visible, `medium` = top always visible + 50% random reveal that's fixed once rolled, `hard` = top-only until revealed by a move). Revealed positions persist across moves and can be restored from saved game state.
  - `game-solver.ts` — solvability/solved-state checking (`isSolved`, used by `Board` to detect game completion).
  - `game-solver copy.ts` — stray duplicate file; not imported anywhere, don't treat it as a second source of truth.
- **`shared/`** — cross-page UI: `header/`, `bottom-picker/` (drum-roll style picker used for game setup), `picker/` (`usePicker` hook + `picker.tsx`). Re-exported via `shared/index.ts`.

State flow: `Home` builds a `Puzzle`/`GameState` and navigates to `/game` passing `{ game, settings, revealedPositions }` in router state; `Board` reads that state (falling back to generating a new puzzle via `PuzzleGeneratorAPI` if none was passed), drives moves through `GameAPI`, tracks per-move visibility via `DifficultyManager`, and persists progress via `saveGame`/`clearGame` (`entities/game/model/storage.ts`).

Routing is defined in `src/App.tsx`: `/` → `Home`, `/game` → `Board`.
