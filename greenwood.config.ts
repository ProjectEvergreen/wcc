import { greenwoodPluginMarkdown } from '@greenwood/plugin-markdown';
import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';
import { greenwoodPluginCssModules } from '@greenwood/plugin-css-modules';
import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';
import fs from 'node:fs';
import type { Config } from '@greenwood/cli';

// NOTE: Greenwood does not run the copy plugin in dev, so we have to do this manually for now
const effectUrl = new URL('./node_modules/wc-compiler/dist/effect.js', import.meta.url);

fs.mkdirSync(new URL('./', effectUrl), { recursive: true });
fs.copyFileSync(new URL('./dist/effect.js', import.meta.url), effectUrl);

const config: Config = {
  activeContent: true,
  workspace: new URL('./docs/', import.meta.url),
  prerender: true,
  polyfills: {
    importAttributes: ['css'],
  },
  plugins: [
    greenwoodPluginImportRaw(),
    greenwoodPluginCssModules(),
    greenwoodPluginImportJsx(),
    greenwoodPluginMarkdown({
      plugins: [
        '@mapbox/rehype-prism',
        'rehype-slug',
        'rehype-autolink-headings',
        'remark-github',
        'remark-gfm',
        {
          name: 'rehype-external-links',
          options: {
            // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#security_and_privacy
            rel: ['nofollow', 'noopener', 'noreferrer'],
            target: '_blank',
            contentProperties: { className: ['no-show-screen-reader'] },
            content: [{ type: 'text', value: ' (opens in a new window)' }],
            properties: { className: ['external-link-icon'] },
          },
        },
      ],
    }),
  ],
};

export default config;
