import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { parseJsx } from './src/jsx-loader.js';
import { generate } from 'astring'; // comes from @greenwood/plugin-import-jsx
import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';
// @ts-expect-error
import { readAndMergeConfig } from '@greenwood/cli/src/lifecycles/config.js';
// @ts-expect-error
import { initContext } from '@greenwood/cli/src/lifecycles/context.js';
import fs from 'node:fs/promises';
import type { Plugin } from 'vite';

// initialize Greenwood context and plugins
const config = await readAndMergeConfig();
const context = await initContext({ config });
const compilation = { context, config };
// @ts-expect-error
const rawResource = greenwoodPluginImportRaw()[0].provider(compilation);

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
  },
  plugins: [transformJsx(), transformRawImports()],
});
