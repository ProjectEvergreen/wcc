import type { Config } from '@greenwood/cli';
import { greenwoodPluginMarkdown } from '@greenwood/plugin-markdown';
import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';

// "@mapbox/rehype-prism": "^0.8.0",
// "rehype-autolink-headings": "^6.1.1",
// "rehype-raw": "^6.1.1",
// "rehype-slug": "^5.0.1",
// "rehype-stringify": "^9.0.3",
// "remark-parse": "^10.0.1",
// "remark-rehype": "^10.1.0",
// "remark-toc": "^8.0.1",

const config: Config = {
  workspace: new URL('./docs/', import.meta.url),
  prerender: true,
  plugins: [
    greenwoodPluginImportJsx(),
    greenwoodPluginMarkdown({
      plugins: [],
    }),
  ],
};

export default config;
