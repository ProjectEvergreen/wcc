export default {
  extends: ['stylelint-config-recommended'],
  plugins: ['@double-great/stylelint-a11y'], // -> no `extends` https://github.com/double-great/stylelint-a11y/issues/65
  rules: {
    'a11y/media-prefers-reduced-motion': true,
    'a11y/no-outline-none': true,
    'a11y/selector-pseudo-class-focus': true,
  },
};
