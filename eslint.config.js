import js from '@eslint/js';
import globals from 'globals';
import noOnlyTests from 'eslint-plugin-no-only-tests';
// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';
import tslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default [
  {
    // https://github.com/eslint/eslint/discussions/18304#discussioncomment-9069706
    ignores: ['node_modules/*', 'dist/*', 'coverage/*', 'public/*', 'storybook-static'],
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
      ...storybook.configs['flat/recommended'].rules,
      ...tslint.configs.recommended.rules,
      // turn this off for Prettier
      'no-irregular-whitespace': 'off',
      'no-only-tests/no-only-tests': 'error',
    },
    plugins: {
      'no-only-tests': noOnlyTests,
    },
  },
  eslintConfigPrettier,
];
