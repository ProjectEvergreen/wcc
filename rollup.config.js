import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/wcc.js',
  output: {
    file: 'dist/wcc.dist.cjs',
    format: 'cjs'
  },
  plugins: [
    nodeResolve({
      exportConditions: ['default', 'module', 'import', 'node']
    }),
    commonjs()
  ]
};