// https://commitlint.js.org/reference/rules.html
import type { UserConfig } from '@commitlint/types';

export default {
  rules: {
    'type-case': [2, 'always', 'lower-case'],
    'type-enum': [2, 'always', ['feature', 'enhancement', 'fix', 'chore', 'docs', 'revert']],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'scope-enum': [2, 'always', ['compiler', 'jsx', 'deps', 'workspace']],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
    'body-case': [2, 'always', 'lower-case'],
    'header-case': [0, 'always', 'lower-case'],
  },
} satisfies UserConfig;
