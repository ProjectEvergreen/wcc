import fs from 'node:fs/promises';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from '@mapbox/rehype-prism';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkToc from 'remark-toc';
import { unified } from 'unified';

import { renderToString } from './src/wcc.js';

async function init() {
  const distRoot = './dist';
  const pagesRoot = './docs/pages';
  const pages = await fs.readdir(new URL(pagesRoot, import.meta.url));
  const { html } = await renderToString(new URL('./docs/layout.js', import.meta.url));

  await fs.rm(distRoot, { recursive: true, force: true });
  await fs.mkdir(distRoot, { recursive: true });
  await fs.mkdir(`${distRoot}/assets`, { recursive: true });

  await fs.copyFile(new URL('./node_modules/prismjs/themes/prism.css', import.meta.url), new URL(`${distRoot}/prism.css`, import.meta.url));
  await fs.copyFile(new URL('./node_modules/simple.css/dist/simple.min.css', import.meta.url), new URL(`${distRoot}/simple.min.css`, import.meta.url));
  await fs.cp(new URL('./docs/assets', import.meta.url), new URL(`${distRoot}/assets`, import.meta.url), { recursive: true });
  await fs.copyFile(new URL('./docs/assets/favicon.ico', import.meta.url), new URL(`${distRoot}/favicon.ico`, import.meta.url));

  for (const page of pages) {
    const route = page.replace('.md', '');
    const outputPath = route === 'index' ? '' : `${route}/`;
    const markdown = await fs.readFile(new URL(`${pagesRoot}/${page}`, import.meta.url), 'utf-8');
    const content = (await unified()
      .use(remarkParse)
      .use(remarkToc, { tight: true })
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSlug)
      .use(rehypeRaw)
      .use(rehypeAutolinkHeadings)
      .use(rehypePrism)
      .use(rehypeStringify)
      .process(markdown)).value;

    await fs.mkdir(`./dist/${outputPath}`, { recursive: true });
    await fs.mkdir(`${distRoot}/${outputPath}`, { recursive: true });

    await fs.writeFile(new URL(`${distRoot}/${outputPath}/index.html`, import.meta.url), `
      <!DOCTYPE html>
      <html lang="en" prefix="og:http://ogp.me/ns#">

        <head>
          <title>WCC - Web Components Compiler</title>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <meta charset="utf-8">
          <meta name="description" content="An experimental native Web Components compiler."/>
          <meta property="og:description" content="An experimental native Web Components compiler"/>
          <meta property="og:title" content="WCC - Web Components Compiler"/>
          <meta property="og:image" content="https://merry-caramel-524e61.netlify.app/assets/wcc-logo.png">

          <link rel="preload" href="/prism.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
          <link rel="preload" href="/simple.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
          <noscript><link rel="stylesheet" href="/prism.css"></noscript>
          <noscript><link rel="stylesheet" href="/simple.min.css"></noscript>
        </head>

        <body>

          ${html.replace('<slot name="content"></slot>', content)}

        </body>
      </html>
    `.trim());
  }
}

init();