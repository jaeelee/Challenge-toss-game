const ISSUE_PATTERN = /^LIQB_\d+$/;

export default {
  extends: ['@commitlint/config-conventional'],
  // Header format: "[LIQB_1] feat(scope): subject" — issue key is mandatory,
  // scope is optional, same as plain Conventional Commits otherwise.
  parserPreset: {
    parserOpts: {
      headerPattern: /^\[([A-Za-z0-9_-]+)\]\s+(\w+)(?:\(([^)]+)\))?:\s+(.+)$/,
      headerCorrespondence: ['issue', 'type', 'scope', 'subject'],
    },
  },
  plugins: [
    {
      rules: {
        'issue-format': (parsed) => {
          const { issue } = parsed;
          if (!issue) {
            return [
              false,
              '커밋 메시지 맨 앞에 이슈 번호가 필요합니다. 예: [LIQB_1] feat: 메시지',
            ];
          }
          if (!ISSUE_PATTERN.test(issue)) {
            return [
              false,
              `이슈 번호 형식이 올바르지 않습니다: "${issue}" (LIQB_숫자 형식이어야 합니다, 예: LIQB_1)`,
            ];
          }
          return [true];
        },
      },
    },
  ],
  rules: {
    // Historically this repo also used bare Korean summaries ("layout modify",
    // "fix error") without a type prefix. New commits must use
    // "[LIQB_N] type: subject"; see docs/conventions/git.md for the full spec.
    'subject-case': [0], // allow Korean subjects (case rules don't apply)
    'issue-format': [2, 'always'],
  },
};
