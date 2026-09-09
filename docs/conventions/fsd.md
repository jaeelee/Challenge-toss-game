# Feature-Sliced Design (FSD) 컨벤션

이 프로젝트의 프론트엔드 아키텍처 규칙. 요약은 `AGENTS.md`에, 강제는 Steiger + ESLint에, 상세 근거는 이 문서에 있다. 표준 원문은 https://feature-sliced.design 참고.

## 1. 레이어 (Layers)

FSD 표준 레이어는 위에서 아래로 **`app` → `pages` → `widgets` → `features` → `entities` → `shared`** 이다. 각 레이어는 **자기보다 아래 레이어만 import** 할 수 있다(상향 의존 금지, 같은 레이어 간 cross-import 금지).

이 프로젝트가 현재 사용하는 레이어:

| 레이어     | 위치                                     | 이 프로젝트에서                                                          |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `app`      | `src/App.tsx`, `src/main.tsx`            | 라우팅/엔트리/전역 스타일. 아직 `src/app/`으로 분리되지 않음(개선 여지). |
| `pages`    | `src/pages/home`, `src/pages/game-board` | 라우트 단위 화면.                                                        |
| `widgets`  | —                                        | 미사용. 여러 features를 조합하는 큰 UI 블록이 생기면 도입.               |
| `features` | —                                        | 미사용. "사용자 액션" 단위 기능이 분리될 때 도입.                        |
| `entities` | `src/entities/game`                      | 도메인 모델(퍼즐/병/색/게임상태).                                        |
| `shared`   | `src/shared`                             | 재사용 UI·유틸. 특정 도메인/기능에 묶이지 않음.                          |

> 모든 레이어를 다 쓸 필요는 없다. 다만 **레이어 이름은 표준을 지키고, import 방향 규칙은 반드시 지킨다.**

## 2. 슬라이스 (Slices)

`pages`/`entities` 등 레이어 아래의 도메인 분할 단위. 예: `entities/game`, `pages/game-board`.

- **슬라이스 간 cross-import 금지.** 같은 레이어의 다른 슬라이스를 직접 import 하지 않는다. 공유가 필요하면 더 낮은 레이어(`shared`/`entities`)로 내린다.
- `shared`와 `app`은 슬라이스가 없고 **세그먼트를 직접** 가진다.

## 3. 세그먼트 (Segments)

슬라이스 내부를 목적별로 나눈 폴더. 표준 이름:

- `ui` — 화면 표시(컴포넌트, 스타일, 포매터)
- `model` — 데이터 모델(타입, 스토어, 비즈니스 로직)
- `lib` — 이 슬라이스가 쓰는 라이브러리성 코드
- `api` — 백엔드 연동(현재 이 프로젝트엔 없음)
- `config` — 설정/상수(현재 `lib`에 섞여 있음)

이 프로젝트는 `ui`/`model`/`lib`만 사용한다. 백엔드가 없어 `api`는 없다.

## 4. Public API (가장 자주 어기는 규칙)

**모든 슬라이스/세그먼트는 `index.ts`(Public API)로만 외부에 노출된다. 외부 코드는 내부 파일 경로를 직접 import 하면 안 된다.**

```ts
// ✅ Public API 경유
import { saveGame, type Puzzle } from '/entities/game';

// ❌ Public API 우회 (내부 파일 직접 접근) — fsd/no-public-api-sidestep 위반
import { saveGame } from '/entities/game/model/storage';
import type { Difficulty } from '/entities/game/model/types';
```

`entities/game/index.ts`는 이미 types·storage·constants를 re-export 하므로, 소비자는 항상 `/entities/game`에서 가져와야 한다.

## 5. Import 경로 규칙 (이 프로젝트 특수사항)

FSD 표준은 보통 `@/` 또는 `@x` alias를 쓰지만, **이 프로젝트는 `/`로 시작하는 절대경로**를 쓴다(예: `/entities/game`, `/pages/game-board/...`). 상대경로(`./`, `../`)는 ESLint `no-restricted-imports`로 금지된다.

- alias 정의는 두 곳이 **동기화**되어야 한다: `vite.config.ts`의 정규식 alias, `tsconfig.app.json`의 `paths`.
- `src/` 아래 **새 최상위 디렉터리를 추가하면** `vite.config.ts`의 alias 정규식에 그 이름을 반드시 추가한다(안 하면 타입체크는 통과하나 런타임 resolve 실패).
- 알려진 예외: `src/pages/home/index.tsx`는 상대경로를 쓴다(레거시). 새 코드에서 따라하지 말 것.

## 6. 네이밍

- 레이어 이름은 표준 철자를 정확히 지킨다(`fsd/typo-in-layer-name`).
- 세그먼트 안에 `ui`/`model`/`lib`/`api` 같은 **세그먼트 예약어를 폴더명으로 재사용하지 않는다**(`fsd/no-reserved-folder-names`).
- `entities` 슬라이스 이름의 단·복수 표기를 일관되게 한다.

## 7. 현재 알려진 위반 (개선 백로그)

`yarn lint:fsd` 기준 현재 10건. 즉시 빌드를 깨지는 않지만(별도 스크립트), 점진적으로 정리한다:

1. **Public API 우회 3건** — `board.tsx`(`/entities/game/model/storage`), `difficulty-manager.ts`(`/entities/game/model/types`), `home.tsx`(`/shared/picker/picker`). → `/entities/game`, `shared` public API 경유로 교체.
2. **shared → entities 상향 import** — `shared/picker/picker.tsx`가 `entities`를 import. shared는 도메인에 의존하면 안 됨 → 필요한 타입/데이터를 props로 주입하거나 해당 코드를 `entities`/`features`로 승격.
3. **shared 구조 불일치** — 현재 `shared/<name>/ui/*` 형태(슬라이스처럼). FSD의 shared는 세그먼트 직접(`shared/ui/*`, `shared/lib/*`). 각 세그먼트 public API 누락, `ui` 예약폴더명 경고 발생. → 중장기적으로 `shared/ui/{header,picker,...}` 구조로 재편 검토.
4. **shared 레이어 index 파일** — `shared/index.ts`는 레이어 레벨 배럴로 표준상 불허(`fsd/no-layer-public-api`). shared는 세그먼트별 public API를 쓴다.

수정은 `game-logic`/`frontend-ui`/`code-reviewer` 에이전트로 진행하고, 각 수정 후 `yarn lint:fsd`로 위반 수가 줄었는지 확인한다.

## 8. 검증 방법

```bash
yarn lint       # ESLint: 상대경로 import 금지 등 코드 규칙
yarn lint:fsd   # Steiger: FSD 아키텍처 규칙(레이어/슬라이스/Public API)
yarn build      # 타입체크 + 프로덕션 빌드
```

- Steiger 설정은 루트 `steiger.config.ts`(`@feature-sliced/steiger-plugin`의 `recommended`).
- Claude Code에서는 `/check-fsd` 커맨드로 위 검증을 한 번에 실행하고 결과를 요약받을 수 있다.
- 규칙을 의도적으로 완화하려면 `steiger.config.ts`에서 해당 `files`에 대해 rule을 `'off'`로 두고, **완화 이유를 이 문서에 기록**한다.
