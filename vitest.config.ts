import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { parseJsx } from './src/jsx-loader.js';
import { generate } from 'astring'; // comes from @greenwood/plugin-import-jsx
import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';
// @ts-expect-error
import { greenwoodPluginStandardCss } from '@greenwood/cli/src/plugins/resource/plugin-standard-css.js';
// @ts-expect-error
import { readAndMergeConfig } from '@greenwood/cli/src/lifecycles/config.js';
// @ts-expect-error
import { initContext } from '@greenwood/cli/src/lifecycles/context.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

// initialize Greenwood context and plugins
const config = await readAndMergeConfig();
const context = await initContext({ config });
const compilation = { context, config };
// @ts-expect-error
const rawResource = greenwoodPluginImportRaw()[0].provider(compilation);
const standardCssResource = greenwoodPluginStandardCss.provider(compilation);

function transformJsx(): Plugin {
  return {
    name: 'transform-jsx',
    enforce: 'pre',
    transform: (src, id) => {
      if (id.endsWith('.tsx') || id.endsWith('.jsx')) {
        const tree = parseJsx(new URL(`file://${id}`));
        const contents = generate(tree);

        return {
          code: contents,
          map: null,
        };
      }
    },
  };
}

function transformConstructableStylesheetsPlugin(): Plugin {
  return {
    name: 'transform-constructable-stylesheets',
    enforce: 'pre',
    resolveId: (id, importer) => {
      if (
        // you'll need to configure this `importer` line to the location of your own components
        importer?.indexOf('/docs/components/') >= 0 &&
        id.endsWith('.css') &&
        !id.endsWith('.module.css')
      ) {
        // append .type to the end of Constructable Stylesheet file paths so that they are not automatically precessed by Vite's default pipeline
        return path.join(path.dirname(importer), `${id}.type`);
      }
    },
    load: async (id) => {
      if (id.endsWith('.css.type')) {
        const filename = id.slice(0, -5);
        const contents = await fs.readFile(filename, 'utf-8');
        const url = new URL(`file://${id.replace('.type', '')}`);
        // "coerce" native constructable stylesheets into inline JS so Vite / Rollup do not complain
        const request = new Request(url, {
          headers: {
            Accept: 'text/javascript',
          },
        });
        const response = await standardCssResource.intercept(url, request, new Response(contents));
        const body = await response.text();

        return body;
      }
    },
  };
}

function transformRawImports(): Plugin {
  return {
    name: 'transform-raw-imports',
    enforce: 'pre',
    transform: async (src, id) => {
      if (id.endsWith('?type=raw')) {
        const url = new URL(`file://${id}`);
        const contents = await fs.readFile(url, 'utf-8');
        const response = await rawResource.intercept(url, null, new Response(contents));
        const body = await response.text();

        return {
          code: body,
          map: null,
        };
      }
    },
  };
}

export default defineConfig({
  test: {
    include: ['./docs/**/*.test.ts'],
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
    coverage: {
      provider: 'v8',
      include: ['./docs/components/**'],
      exclude: ['./docs/components/sandbox/**'],
      thresholds: {
        lines: 65,
        functions: 75,
        branches: 50,
        statements: 65,
      },
    },
  },
  plugins: [transformJsx(), transformRawImports(), transformConstructableStylesheetsPlugin()],
});
