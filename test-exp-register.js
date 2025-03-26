import { register } from 'node:module';

register('./test-exp-loader.js', import.meta.url);