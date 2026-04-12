import type { Config, CopyPlugin } from '@greenwood/cli';
import { greenwoodPluginMarkdown } from '@greenwood/plugin-markdown';
import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';
import { greenwoodPluginCssModules } from '@greenwood/plugin-css-modules';
import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';
import fs from 'node:fs';

// NOTE: Greenwood does not run the copy plugin in dev, so we have to do this manually for now
fs.copyFileSync(
  new URL('./src/effect.js', import.meta.url),
  new URL('./node_modules/wc-compiler/src/effect.js', import.meta.url),
);

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
