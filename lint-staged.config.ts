import type { Configuration } from 'lint-staged';

export default {
  '*.{js,jsx,ts,tsx}': ['pnpm run lint:js --'],
  '*.*': ['pnpm run lint:ls --', 'pnpm run format --'],
} satisfies Configuration;
