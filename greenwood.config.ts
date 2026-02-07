import type { Config } from '@greenwood/cli';
import { greenwoodPluginMarkdown } from '@greenwood/plugin-markdown';
import { greenwoodPluginCssModules } from '@greenwood/plugin-css-modules';
import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';
import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';

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
