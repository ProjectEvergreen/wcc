import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'src/wcc.js',
  output: {
    file: 'dist/wcc.dist.cjs',
    format: 'cjs'
  },
  plugins: [
    json(),
    nodeResolve(),
    commonjs()
  ]
};