import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['./docs/**/*.test.ts'],
  },
});
