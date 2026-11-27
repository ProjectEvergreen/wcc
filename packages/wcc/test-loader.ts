// https://jestjs.io/docs/ecmascript-modules
// https://github.com/nodejs/node/discussions/41711
import fs from 'fs';
import path from 'path';
import {
  load as experimentalLoadJsx,
  resolve as experimentalResolveJsx,
} from 'wc-compiler/jsx-loader';
import type { LoadHook, ResolveHook } from 'node:module';

export async function load(
  url: Parameters<LoadHook>[0],
  context: Parameters<LoadHook>[1],
  defaultLoad: Parameters<LoadHook>[2],
): Promise<Awaited<ReturnType<LoadHook>>> {
  const ext = path.extname(url);

  if (ext === '') {
    return loadBin(url, context, defaultLoad);
  } else if (ext === '.jsx' || ext === '.tsx') {
    return experimentalLoadJsx(url, context, defaultLoad);
  } else if (ext === '.css') {
    return {
      format: 'module',
      shortCircuit: true,
      source: `const css = \`${(await fs.promises.readFile(new URL(url), 'utf-8')).replace(/\r?\n|\r/g, ' ').replace(/\\/g, '\\\\')}\`;\nexport default css;`,
    };
  }

  // Preserve the same legacy forwarding as the library's loader hooks.
  return (defaultLoad as (...args: unknown[]) => ReturnType<typeof defaultLoad>)(
    url,
    context,
    defaultLoad,
  );
}

export function resolve(
  specifier: Parameters<ResolveHook>[0],
  context: Parameters<ResolveHook>[1],
  defaultResolve: Parameters<ResolveHook>[2],
): ReturnType<ResolveHook> {
  const ext = path.extname(specifier);

  if (ext === '.jsx' || ext === '.tsx') {
    return experimentalResolveJsx(specifier, context, defaultResolve);
  } else {
    return (defaultResolve as (...args: unknown[]) => ReturnType<typeof defaultResolve>)(
      specifier,
      context,
      defaultResolve,
    );
  }
}

async function loadBin(
  url: Parameters<LoadHook>[0],
  context: Parameters<LoadHook>[1],
  defaultLoad: Parameters<LoadHook>[2],
): Promise<Awaited<ReturnType<LoadHook>>> {
  const dirs = path.dirname(url.replace(/[A-Z]:\//g, '')).split('/');
  const parentDir = dirs.at(-1);
  const grandparentDir = dirs.at(-3);

  let format: Parameters<LoadHook>[1]['format'];

  if (parentDir === 'bin' && grandparentDir === 'node_modules') {
    const libPkgUrl = new URL('../package.json', url);
    const { type } = await fs.promises.readFile(libPkgUrl, 'utf-8').then(JSON.parse);

    format = type === 'module' ? 'module' : 'commonjs';
  }

  return defaultLoad(url, {
    ...context,
    format,
  });
}
