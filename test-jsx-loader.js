// https://jestjs.io/docs/ecmascript-modules
// https://github.com/nodejs/node/discussions/41711
import escodegen from 'escodegen';
import fs from 'fs';
import path from 'path';
import { parseJsx } from './src/jsx-loader.js';

export async function load(url, context, defaultLoad) {
  const ext = path.extname(url);

  if (ext === '') {
    return loadBin(url, context, defaultLoad);
  } else if (ext === '.jsx') {
    const jsFromJsx = parseJsx(new URL(url));

    return {
      format: 'module',
      source: escodegen.generate(jsFromJsx),
      shortCircuit: true
    };
  }

  return defaultLoad(url, context, defaultLoad);
}

async function loadBin(url, context, defaultLoad) {
  const dirs = path.dirname(url.replace(/[A-Z]:\//g, '')).split('/');
  const parentDir = dirs.at(-1);
  const grandparentDir = dirs.at(-3);

  let format;

  if (parentDir === 'bin' && grandparentDir === 'node_modules') {
    const libPkgUrl = new URL('../package.json', url);
    const { type } = await fs.promises.readFile(libPkgUrl).then(JSON.parse);

    format = type === 'module' ? 'module' : 'commonjs';
  }

  return defaultLoad(url, {
    ...context,
    format
  });
}