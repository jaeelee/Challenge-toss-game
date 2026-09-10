# Git 브랜치 전략 & 커밋 컨벤션

이 프로젝트의 브랜치 운영 방식과 커밋 메시지 규칙. 요약은 `AGENTS.md`에, 커밋 메시지 형식 강제는 `commitlint`+`husky`에 있다. 커밋 컨벤션 원문은 [Conventional Commits 1.0.0 (한국어)](https://www.conventionalcommits.org/ko/v1.0.0/) 참고.

## 1. 브랜치 전략: 경량 Git Flow

풀 버전 Git Flow(`release/*`, `hotfix/*`를 포함한 버전 릴리스 관리)는 2인 팀 규모에 비해 무겁다. 대신 **`main` + `develop` + 단명 작업 브랜치**만 쓰는 경량화 버전을 쓴다 — 실제로 원격에 이미 이 구조(`main`, `develop`, `feat/change-picker`, `ui`)가 존재했다.

| 브랜치          | 역할                                                                          | 수명 |
| --------------- | ----------------------------------------------------------------------------- | ---- |
| `main`          | 배포/안정 버전. 항상 빌드가 통과하는 상태만 유지.                             | 영구 |
| `develop`       | 통합 브랜치. 기본 작업 브랜치이자 PR의 기본 대상.                             | 영구 |
| `feat/<slug>`   | 새 기능 개발. `develop`에서 분기, `develop`으로 머지.                         | 단명 |
| `fix/<slug>`    | 버그 수정. `develop`에서 분기, `develop`으로 머지.                            | 단명 |
| `hotfix/<slug>` | `main`에서 발견된 긴급 수정. `main`에서 분기, `main`과 `develop` 양쪽에 머지. | 단명 |
| `chore/<slug>`  | 빌드/설정/문서 등 기능과 무관한 변경.                                         | 단명 |

- `release/*` 브랜치는 두지 않는다 — 버전을 여러 개 동시에 지원해야 하는 상황이 아니므로. 필요해지면 그때 도입한다.
- 작업 브랜치 이름은 `<type>/<slug>` 형태로, `<type>`은 2절의 커밋 타입과 동일한 어휘를 쓴다(`feat`, `fix`, `chore` 등). `<slug>`는 영어 kebab-case로 짧게(예: `feat/hint-system`, `fix/bottle-height-4-hardcode`).
- `develop → main` 병합은 배포 가능한 상태에 도달했을 때 진행한다. 별도 태그/버전 번호는 아직 쓰지 않는다(필요해지면 `package.json`의 `version`과 함께 시작).
- PR은 기본적으로 `develop`을 대상으로 연다. `hotfix/*`만 예외적으로 `main`을 대상으로 연다.

## 2. 커밋 컨벤션: Conventional Commits + 이슈 번호

형식: `[<issue>] <type>[(<scope>)]: <description>`

이슈 번호(`<issue>`)를 맨 앞 브라켓에 추가한 것 외에는 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/ko/v1.0.0/)과 동일하다.

```
[LIQB_1] feat: 힌트 기능 추가
[LIQB_7] fix(game-generator): bottleHeight 하드코딩 수정
[LIQB_12] docs: FSD 컨벤션 문서 추가
[LIQB_15] chore: eslint-config-prettier 통합
```

### 이슈 번호 형식

`LIQB_<숫자>` — 프로젝트 약어(`LIQB` = **LIQ**uid **B**locks, 대문자 4글자) + `_` + 이슈 번호. 4절 참고.

### 허용 타입 (`@commitlint/config-conventional` 기준)

| 타입       | 의미                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `feat`     | 새 기능                                                                                                            |
| `fix`      | 버그 수정                                                                                                          |
| `docs`     | 문서만 변경                                                                                                        |
| `style`    | 코드 동작에 영향 없는 포맷팅(세미콜론, 공백 등) — Prettier가 자동 처리하는 것과는 별개로, 수동 스타일 변경 시 사용 |
| `refactor` | 기능 변경 없는 코드 구조 개선                                                                                      |
| `perf`     | 성능 개선                                                                                                          |
| `test`     | 테스트 추가/수정                                                                                                   |
| `build`    | 빌드 시스템/의존성 변경 (예: vite, tsconfig)                                                                       |
| `ci`       | CI 설정 변경 (현재 이 프로젝트엔 CI 없음)                                                                          |
| `chore`    | 그 외 잡무성 변경 (설정 파일, 잡다한 정리)                                                                         |
| `revert`   | 이전 커밋 되돌리기                                                                                                 |

### 이 프로젝트 규칙

- **한국어 설명을 허용한다.** `subject-case` 규칙은 꺼져 있다(`commitlint.config.js`) — 영어 대소문자 규칙이 한국어에는 의미가 없기 때문. 다만 `<type>:` 접두사와 콜론 뒤 공백 하나는 항상 지킨다.
- `scope`는 선택이다. 넣을 때는 건드린 슬라이스/세그먼트 이름을 쓴다(예: `fix(game-generator)`, `feat(picker)`).
- 본문(body)이 필요하면 제목 다음 빈 줄을 하나 두고 작성한다(Conventional Commits 표준).
- **알려진 예외**: `992c1d3`(이슈번호 형식 도입) 이전의 과거 커밋들(`[LIQB_N]` 없는 `feat:`/`fix:` 커밋, 그리고 그 이전의 `"layout modify"`, `"fix error"`, `"first commit"` 등)은 이 컨벤션 도입 이전 것이라 소급 적용하지 않는다. 앞으로의 커밋부터 적용한다.

## 3. 강제 방법 (commitlint + husky)

```bash
git commit -m "[LIQB_1] feat: 이런 형식"   # commit-msg 훅이 자동으로 형식 검사
```

- `commitlint.config.js` — 규칙 정의:
  - `@commitlint/config-conventional`을 확장(타입 목록, `subject-empty` 등 기본 규칙).
  - `parserPreset.parserOpts.headerPattern`으로 `[이슈] type(scope): subject` 형태를 파싱하도록 커스터마이즈.
  - 로컬 커스텀 규칙 `issue-format`(인라인 플러그인)으로 이슈 번호가 `LIQB_숫자`인지 검증하고, 틀리면 구체적인 한국어 에러 메시지를 낸다.
  - `subject-case`는 꺼져 있다 — 영어 대소문자 규칙이 한국어에는 의미가 없기 때문.
- `.husky/pre-commit` — 스테이징된 파일에 `lint-staged`(ESLint --fix + Prettier)를 실행.
- `.husky/commit-msg` — 커밋할 때마다 `commitlint --edit`을 실행해 형식이 틀리면 커밋 자체를 막는다.
- 두 훅 모두 `yarn install`(또는 `yarn`) 실행 시 `prepare` 스크립트로 자동 설치된다 — 새로 클론한 사람도 별도 설정 없이 바로 강제된다.
- 커밋 메시지 형식과 스테이징 파일 포맷은 자동 검사되지만, 브랜치 이름 규칙(1절)은 아직 자동 검사하지 않는다 — 리뷰 시 `code-reviewer` 에이전트나 PR 체크리스트로 확인한다.

### 검증 방법

```bash
echo "[LIQB_1] feat: 예시" | yarn commitlint       # 통과
echo "feat: 이슈번호 없음" | yarn commitlint        # 실패 (이슈 번호 필수)
echo "[LQIB_1] feat: 오타" | yarn commitlint        # 실패 (LIQB_숫자 형식 아님)
git commit --allow-empty -m "[LIQB_1] test: 예시"  # 실제 훅 동작 확인
```

## 4. 이슈 번호 관리: GitHub Issues 활용

별도 이슈 트래커(Jira/Linear 등)를 새로 도입하지 않고, 이미 코드가 있는 **GitHub Issues를 그대로 쓴다** — 2인 규모에는 이게 가장 마찰이 적다.

- **작업 시작 전 GitHub Issue를 먼저 연다.** 예: Issue #1 → 커밋에서 `[LIQB_1]`로 참조.
- GitHub이 이슈/PR 번호를 레포 전체에서 단조증가·중복없이 부여하므로, **별도 카운터를 관리할 필요가 없다** — 이슈 번호를 그대로 `LIQB_<번호>`의 `<번호>`로 쓰면 된다.
- 브랜치명에도 이슈 번호를 포함하면 추적이 쉬워진다: `feat/LIQB_1-hint-system`.
- PR 본문에 `Closes #1`을 쓰면 머지 시 해당 이슈가 자동으로 닫힌다.
- **왜 Linear/Jira가 아닌가**: 이 규모(2인, 사이드 프로젝트)에는 계정·워크플로 오버헤드가 크고, 두 도구 모두 이슈 키 구분자가 하이픈(`LIQB-1`)으로 고정되어 있어 이 프로젝트가 요구하는 언더스코어(`LIQB_1`) 포맷과 맞지 않는다. 팀/프로젝트가 커지면 그때 재검토한다.
