---
description: Run the project's Feature-Sliced Design checks (Steiger + ESLint) and summarize violations against the FSD conventions.
allowed-tools: Bash(yarn lint:fsd), Bash(yarn lint), Bash(yarn steiger:*), Read, Grep, Glob
---

Verify this repo's Feature-Sliced Design compliance.

Steps:

1. Run `yarn lint:fsd` (Steiger FSD architecture linter) and capture all findings.
2. Run `yarn lint` (ESLint) and capture import/convention findings (e.g. `no-restricted-imports` relative-path violations).
3. Cross-reference each finding against `docs/conventions/fsd.md` — especially Public API sidesteps (rule `fsd/no-public-api-sidestep`), higher-layer / cross-slice imports (`fsd/forbidden-imports`), and the layer/segment structure rules.

Then report:

- A grouped summary of violations (by rule), each with file path and the concrete fix (e.g. "import from `/entities/game` instead of `/entities/game/model/storage`").
- Which violations are pre-existing/known (listed in section 7 of `docs/conventions/fsd.md`) vs newly introduced by recent changes — if `$ARGUMENTS` names a scope (a path or "staged"), focus on that.
- Whether the count went up or down relative to the known baseline of 10.

Do not edit files — this is a read-and-report command. If the user wants fixes applied, hand off to the `frontend-ui` / `game-logic` / `code-reviewer` agents.
