import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/wcc.js',
  output: {
    file: 'dist/wcc.dist.js',
    format: 'cjs'
  },
  plugins: [
    nodeResolve(),
    commonjs()
  ]
};