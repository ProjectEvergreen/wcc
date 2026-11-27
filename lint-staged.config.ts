import type { Configuration } from 'lint-staged';

export default {
  '*.{js,ts,tsx}': ['pnpm run lint:js --'],
  '*.*': ['pnpm run lint:ls --', 'pnpm run format --'],
} satisfies Configuration;
