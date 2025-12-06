// TODO: depend on these modules first party
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import type { RollupOptions } from 'rollup';

function externalizeFsBuiltinPlugin() {
  return {
    name: 'externalize-fs-builtin',
    resolveId(source: string) {
      if (source === 'fs') {
        return source;
      }
      return null;
    },
    load(id: string) {
      if (id === 'fs') {
        return `
          const noop = () => {};
          const fs = {
            readFileSync: noop,
            promises: {
              readFile: noop
            }
          }

          export default fs;
        `;
      }
      return null;
    },
  };
}

export default {
  input: './repl.ts',
  output: {
    file: './docs/assets/repl.bundle.js',
    format: 'esm',
  },
  plugins: [
    externalizeFsBuiltinPlugin(),
    nodeResolve(),
    // @ts-expect-error - https://github.com/rollup/plugins/issues/1860
    commonjs(),
  ],
} satisfies RollupOptions;
