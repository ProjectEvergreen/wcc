import fs from 'node:fs/promises';
import rehypePrism from '@mapbox/rehype-prism';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { renderToString } from './src/wcc.js';

async function init() {
  const distRoot = './dist';
  const pagesRoot = './docs/pages';
  const pages = await fs.readdir(new URL(pagesRoot, import.meta.url));
  const { html } = await renderToString(new URL('./docs/index.js', import.meta.url), {
    lightMode: true
  });

  await fs.rm(distRoot, { recursive: true, force: true });
  await fs.mkdir(distRoot, { recursive: true });
  await fs.mkdir(`${distRoot}/assets`, { recursive: true });

  await fs.copyFile(new URL('./node_modules/prismjs/themes/prism.css', import.meta.url), new URL(`${distRoot}/prism.css`, import.meta.url));
  await fs.copyFile(new URL('./node_modules/simple.css/dist/simple.min.css', import.meta.url), new URL(`${distRoot}/simple.min.css`, import.meta.url));
  await fs.cp(new URL('./docs/assets', import.meta.url), new URL(`${distRoot}/assets`, import.meta.url), { recursive: true });

  for (const page of pages) {
    // for now, just repurposing the README for home page content
    const isHomePage = page === 'index.md';
    const pageLocation = isHomePage ? './README.md' : `${pagesRoot}/${page}`;
    const markdown = await fs.readFile(new URL(pageLocation, import.meta.url), 'utf-8');
    let content = (await unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypePrism)
      .use(rehypeStringify)
      .process(markdown)).value;

    if (isHomePage) {
      const contentFilter = content.substring(content.indexOf('<h1>wcc</h1>'), content.indexOf('<h2>Overview</h2>') + 17);
      content = content.replace(contentFilter, '');
    }

    const route = page.replace('.md', '');
    const outputPath = route === 'index' ? '' : `${route}/`;

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