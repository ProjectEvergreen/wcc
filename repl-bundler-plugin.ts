import * as rollup from 'rollup';
// TODO: depend on these modules first party
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import type { ResourcePlugin } from '@greenwood/cli';

function externalizeFsBuiltinRollupPlugin() {
  return {
    name: 'externalize-fs-builtin',
    resolveId(source: string) {
      if (source === 'fs') {
        return source;
      }
      return null;
    },
    load(id: string) {
      if (id === 'fs') {
        return `
          const noop = () => {};
          const fs = {
            readFileSync: noop,
            promises: {
              readFile: noop
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

  async shouldServe(url: URL) {
    return url.pathname.endsWith('scripts/repl.ts');
  }

  async serve(url: URL) {
    const bundle = await rollup.rollup({
      input: url.pathname,
      treeshake: false,
      plugins: [
        externalizeFsBuiltinRollupPlugin(),
        nodeResolve(),
        // @ts-expect-error - https://github.com/rollup/plugins/issues/1860
        commonjs(),
      ],
    });
    const { output } = await bundle.generate({
      format: 'esm',
    });

    return new Response(output[0].code, {
      headers: {
        'Content-Type': 'text/javascript',
      },
    });
  }
}

export function replBundlerResourcePlugin(options = {}): ResourcePlugin {
  return {
    type: 'resource',
    name: 'repl-bundler-resource-plugin',
    provider: () => new ReplBundlerResource(),
  };
}
