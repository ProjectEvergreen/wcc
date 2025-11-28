// TODO: depend on these modules first party
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

/** @type {import('rollup').RollupOptions} */
export default {
  input: './repl.js',
  output: {
    file: './docs/assets/repl.bundle.js',
    format: 'esm',
  },
  plugins: [nodeResolve(), commonjs()],
};
