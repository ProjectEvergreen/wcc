import js from '@eslint/js';
import globals from 'globals';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import tslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default [
  {
    // https://github.com/eslint/eslint/discussions/18304#discussioncomment-9069706
    ignores: ['node_modules/*', 'dist/*', 'coverage/*', 'public/*'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.mocha,
        ...globals.chai,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // turn this off for Prettier
      'no-irregular-whitespace': 'off',
      'no-only-tests/no-only-tests': 'error',
    },
    plugins: {
      'no-only-tests': noOnlyTests,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tslint.parser,
    },
    rules: {
      // TypeScript resolves globals and type-only declarations itself.
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
  ...tslint.configs.recommended.map((config) => ({
    ...config,
    files: ['src/**/*.ts', 'tsdown.config.ts'],
  })),
  {
    // JSX attributes intentionally accept arbitrary custom-element values.
    files: ['src/jsx.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  eslintConfigPrettier,
];
