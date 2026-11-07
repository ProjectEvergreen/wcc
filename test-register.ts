import { register } from 'node:module';

register('./test-loader.ts', import.meta.url);
