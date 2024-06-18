// https://jestjs.io/docs/ecmascript-modules
// https://github.com/nodejs/node/discussions/41711
import fs from 'fs';
import path from 'path';
import { load as experimentalLoad, resolve as experimentalResolve } from './src/jsx-loader.js';
import { transform } from 'sucrase';

export async function load(url, context, defaultLoad) {
  const ext = path.extname(url);

  if (ext === '') {
    return loadBin(url, context, defaultLoad);
  } else if (ext === '.jsx') {
    return experimentalLoad(url, context, defaultLoad);
  } else if (ext === '.ts') {
    const contents = await fs.promises.readFile(new URL(url), 'utf-8');
    const result = transform(contents, {
      transforms: ['typescript', 'jsx'],
      jsxRuntime: 'preserve'
    });

    return {
      format: 'module',
      shortCircuit: true,
      source: result.code
    };
  } else if (ext === '.css') {
    return {
      format: 'module',
      shortCircuit: true,
      source: `const css = \`${(await fs.promises.readFile(new URL(url), 'utf-8')).replace(/\r?\n|\r/g, ' ').replace(/\\/g, '\\\\')}\`;\nexport default css;`
    };
  }

  return defaultLoad(url, context, defaultLoad);
}

export function resolve(specifier, context, defaultResolve) {
  const ext = path.extname(specifier);

  if (ext !== '') {
    return experimentalResolve(specifier, context, defaultResolve);
  } else {
    return defaultResolve(specifier, context, defaultResolve);
  }
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