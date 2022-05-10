import fs from 'node:fs/promises';
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
  const { html, metadata } = await renderToString(new URL('./docs/index.js', import.meta.url), false);

  // await fs.rm(distRoot, { recursive: true, force: true });
  // await fs.mkdir('./dist', { recursive: true });
  // await fse.copy('./www/assets', `${distRoot}/www/assets`);
  // await fse.copy('./www/components', `${distRoot}/www/components`);
  // await fse.copy('./docs/pages', `${distRoot}/www/pages`);

  for (const page of pages) {
    // for now, just repurposing the README for home page content
    const isHomePage = page === 'index.md';
    const pageLocation = isHomePage ? './README.md' : `${pagesRoot}/${page}`;
    const markdown = await fs.readFile(new URL(pageLocation, import.meta.url), 'utf-8');
    let content = (await unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify)
      .process(markdown)).value;

    if (isHomePage) {
      const contentFilter = content.substring(content.indexOf('<h1>wcc</h1>'), content.indexOf('<h2>Overview</h2>') + 17);
      content = content.replace(contentFilter, '');
    }

    // const lazyJs = [];
    // const eagerJs = [];

    // for (const asset in assets) {
    //   const a = assets[asset];

    //   a.tagName = asset;

    //   if (a.moduleURL.href.endsWith('.js')) {
    //     if (a.hydrate === 'lazy') {
    //       lazyJs.push(a);
    //     } else {
    //       eagerJs.push(a);
    //     }
    //   }
    // }

    // bundle / copy dependency files
    const route = page.replace('.md', '');
    const outputPath = route === 'index' ? '' : `${route}/`;

    await fs.mkdir(`./dist/${outputPath}`, { recursive: true });
    await fs.mkdir(`${distRoot}/${outputPath}`, { recursive: true });

    await fs.writeFile(new URL(`${distRoot}/${outputPath}/index.html`, import.meta.url), `
      <!DOCTYPE html>
      <html lang="en" prefix="og:http://ogp.me/ns#">
      
        <head>
          <title>Web Components Compiler (WCC)</title>
          <meta property="og:title" content="Web Components Compiler (WCC)"/>
          <link rel="stylesheet" href="https://unpkg.com/simpledotcss@2.1.0/simple.min.css">
        </head>

        <body>

          ${html.replace('<slot name="content"></slot>', content)}

        </body>
      </html>
    `.trim());
  }
}

init();