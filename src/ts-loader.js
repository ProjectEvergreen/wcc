import fs from 'fs/promises';
import { transform } from 'sucrase';

const tsRegex = /\.(ts)$/;

export function resolve(specifier, context, defaultResolve) {
  const { parentURL } = context;

  if (tsRegex.test(specifier)) {
    return {
      url: new URL(specifier, parentURL).href,
      shortCircuit: true
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (tsRegex.test(url)) {
    const contents = await fs.readFile(new URL(url), 'utf-8');
    const result = transform(contents, { transforms: ['typescript'] });

    return {
      format: 'module',
      shortCircuit: true,
      source: result.code
    };
  }

  return defaultLoad(url, context, defaultLoad);
}