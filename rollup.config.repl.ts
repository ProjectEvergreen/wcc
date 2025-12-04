// TODO: depend on these modules first party
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import type { RollupOptions } from 'rollup';

export default {
  input: './repl.ts',
  output: {
    file: './docs/assets/repl.bundle.js',
    format: 'esm',
  },
  plugins: [
    nodeResolve(),
    // @ts-expect-error - https://github.com/rollup/plugins/issues/1860
    commonjs(),
  ],
} satisfies RollupOptions;
