import * as rollup from 'rollup';
import amaro from 'amaro';
import { fileURLToPath } from 'node:url';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import type { RollupCommonJSOptions } from '@rollup/plugin-commonjs';
import type { ResourcePlugin } from '@greenwood/cli';

// WCC reads source files and hashes generated JSX helpers through Node APIs,
// so we need to provide browser-compatible implementations of those APIs for the REPL worker
function polyfillNodeBuiltInsRollupPlugin() {
  return {
    name: 'polyfill-node-built-ins',
    resolveId(source: string) {
      if (source === 'node:crypto') return source;
      if (source === 'fs') {
        return source;
      }
      return null;
    },
    load(id: string) {
      if (id === 'node:crypto') {
        return `
          import { sha256 } from '@noble/hashes/sha256';
          import { bytesToHex } from '@noble/hashes/utils';
          export function createHash(algorithm) {
            if (algorithm !== 'sha256') throw new Error('Unsupported hash: ' + algorithm);
            const hash = sha256.create();
            return {
              update(source) { hash.update(new TextEncoder().encode(source)); return this; },
              digest(encoding) {
                if (encoding !== 'hex') throw new Error('Unsupported digest encoding: ' + encoding);
                return bytesToHex(hash.digest());
              }
            };
          }
        `;
      }
      if (id === 'fs') {
        // assumes utf-8 encoding
        return `
          const fs = {
            readFileSync: (url) => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', url.href, false); 
              xhr.send(null);

              if (xhr.status === 200) {
                return xhr.responseText;
              }
              throw new Error('Unable to read ' + url.href + ': ' + xhr.status);
            },
            promises: {
              readFile: async function(url) {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Unable to read ' + url.href + ': ' + response.status);
                const text = await response.text();

                return text;
              },
            }
          }

          export default fs;
        `;
      }
      return null;
    },
  };
}

class ReplBundlerResource {
  extensions: string[];

  constructor() {
    this.extensions = [];
  }

  async shouldIntercept(url: URL) {
    return url.pathname.endsWith('/scripts/playground/repl.ts');
  }

  async intercept(url: URL) {
    const bundle = await rollup.rollup({
      input: fileURLToPath(url),
      treeshake: true,
      plugins: [
        // This separate Rollup build reads TypeScript from disk, bypassing Greenwood's type stripping.
        {
          name: 'strip-types',
          transform(code, id) {
            if (id.endsWith('.ts')) {
              return { code: amaro.transformSync(code, { mode: 'strip-only' }).code, map: null };
            }
          },
        },
        polyfillNodeBuiltInsRollupPlugin(),
        nodeResolve(),
        // The package's CJS declarations do not describe its ESM default export under NodeNext.
        (commonjs as unknown as (options?: RollupCommonJSOptions) => rollup.Plugin)(),
      ],
      onLog(level, log, handler) {
        // silence circular dependency warnings from sucrase
        if (log.code === 'CIRCULAR_DEPENDENCY' && log.message.includes('node_modules/sucrase')) {
          return;
        }
        handler(level, log);
      },
    });
    try {
      const { output } = await bundle.generate({ format: 'esm' });
      return new Response(output[0].code, {
        headers: { 'Content-Type': 'text/javascript' },
      });
    } finally {
      await bundle.close();
    }
  }
}

export function replBundlerResourcePlugin(): ResourcePlugin {
  return {
    type: 'resource',
    name: 'repl-bundler-resource-plugin',
    provider: () => new ReplBundlerResource(),
  };
}
