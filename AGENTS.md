# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, etc.) working in this repository.

## Project overview

Liquid Blocks (워터 소트 퍼즐) is a Water Sort Puzzle game built with React 19 + TypeScript + Vite (rolldown-vite). Players move colored liquid between bottles to sort each bottle into a single color.

## Commands

```bash
yarn dev          # start dev server (vite)
yarn build        # type-check (tsc -b) then production build
yarn lint         # eslint . — code quality
yarn lint:fsd     # steiger ./src — FSD architecture rules
yarn format       # prettier --write . — format + sort imports (FSD layer order)
yarn format:check # prettier --check . — verify formatting in CI
yarn preview      # preview production build
```

There is no test suite configured in this repo.

## Code style (ESLint + Prettier)

Prettier owns formatting (including import order), ESLint owns code quality. They're integrated via `eslint-config-prettier` — `eslint.config.js`'s `extends` array puts it last so it disables any ESLint stylistic rule that could conflict with Prettier's output. Don't add formatting-related ESLint rules (indentation, quotes, etc.); change `.prettierrc` instead.

`.prettierrc` uses `@trivago/prettier-plugin-sort-imports` to auto-sort imports by FSD layer order: `react`/`react-dom` → third-party → `/App`|`/main` → `/pages` → `/widgets` → `/features` → `/entities` → `/shared` → `/assets` → relative. Run `yarn format` after writing new imports rather than hand-ordering them.

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

## Git workflow

Full rules live in `docs/conventions/git.md`. Summary:

- **Branching**: lightweight Git Flow — `main` (stable) + `develop` (integration, default PR target) + short-lived `feat/<slug>` / `fix/<slug>` / `hotfix/<slug>` / `chore/<slug>` branches. No `release/*` branches at this project's scale.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/) + a mandatory issue key — `[LIQB_<n>] <type>[(<scope>)]: <description>` (e.g. `[LIQB_1] feat: 힌트 기능 추가`). Types restricted to `feat`/`fix`/`docs`/`style`/`refactor`/`perf`/`test`/`build`/`ci`/`chore`/`revert`. Korean descriptions are fine (`subject-case` is disabled); the `[LIQB_n]` prefix and `<type>:` are not optional.
- **Issue tracking**: GitHub Issues, no separate tracker. Open an issue first, reuse its auto-incrementing number as the `LIQB_<n>` in commits/branches (e.g. issue #1 → `[LIQB_1]`, branch `feat/LIQB_1-hint-system`).
- **Enforced** by `commitlint` (custom `parserPreset` + a local `issue-format` rule validating `LIQB_\d+`) + `husky` hooks — `commit-msg` rejects malformed messages, `pre-commit` runs `lint-staged` (ESLint --fix + Prettier) on staged files. Both auto-install via the `prepare` script on `yarn install`.
- Pre-convention history (commits before `992c1d3`) isn't retroactively held to this rule.

## Architecture

This project follows **Feature-Sliced Design (FSD)**. Full conventions live in `docs/conventions/fsd.md`; the rules you must not break:

- **Layers** (`app` → `pages` → `widgets` → `features` → `entities` → `shared`): a layer may only import from layers _below_ it, never above, and never cross-import another slice on the same layer. Present layers here: `pages`, `entities`, `shared` (+ `app` role in `App.tsx`/`main.tsx`).
- **Public API**: import a slice only through its `index.ts`, never a deep internal path. Use `import { saveGame } from '/entities/game'`, not `'/entities/game/model/storage'`. (This is the most-violated rule — see below.)
- **Import paths**: absolute `/`-rooted only (enforced by ESLint `no-restricted-imports`); keep `vite.config.ts` alias regex and `tsconfig.app.json` paths in sync.
- **Verify** with `yarn lint:fsd` (Steiger, config in `steiger.config.ts`) alongside `yarn lint`/`yarn build`, or run the `/check-fsd` command. There is a known baseline of ~10 pre-existing FSD violations documented in `docs/conventions/fsd.md` §7 — don't add new ones; reduce them when you touch nearby code.

Layout under `src/`:

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

## Agents (subagents)

This repo defines a small roster of project-specific subagents, mirrored for both Claude Code and Codex CLI so either tool can delegate to the same personas. Codex is optional — if it isn't installed, `.codex/` is simply never read and Claude Code's roster works standalone.

| Agent           | When to use                                                                                 | Claude Code                       | Codex CLI                          |
| --------------- | ------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------- |
| `game-logic`    | Puzzle rules/algorithms: moving liquid, generation, solvability, difficulty visibility      | `.claude/agents/game-logic.md`    | `.codex/agents/game-logic.toml`    |
| `frontend-ui`   | React components, CSS, animation, the drum-roll picker                                      | `.claude/agents/frontend-ui.md`   | `.codex/agents/frontend-ui.toml`   |
| `test-engineer` | Bootstrapping Vitest and writing tests (repo currently has none)                            | `.claude/agents/test-engineer.md` | `.codex/agents/test-engineer.toml` |
| `code-reviewer` | Read-only review of a diff against this file's conventions (imports, alias sync, dead code) | `.claude/agents/code-reviewer.md` | `.codex/agents/code-reviewer.toml` |

Each pair shares the same natural-language instructions — only the file format differs (YAML frontmatter + Markdown body for Claude, TOML `developer_instructions` for Codex). When updating an agent's behavior, edit both files together to avoid drift between the two tools.
