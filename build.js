import fs from 'node:fs/promises';
// import fse from 'fs-extra';
import { renderToString } from './src/wcc.js';

async function init() {
  const distRoot = './dist';
  // const pagesRoot = './www/pages';
  // const entries = await fs.readdir(new URL(pagesRoot, import.meta.url));

  // await fs.rm(distRoot, { recursive: true, force: true });
  // await fs.mkdir('./dist', { recursive: true });
  // await fse.copy('./www/assets', `${distRoot}/www/assets`);
  // await fse.copy('./www/components', `${distRoot}/www/components`);
  // await fse.copy('./docs/pages', `${distRoot}/www/pages`);

  // for (const entry of entries.filter(entry => entry.endsWith('.js'))) {
  const { html } = await renderToString(new URL('./docs/index.js', import.meta.url), false);

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
  // const route = entry.replace('.js', '');
  // const outputPath = route === 'index' ? '' : `${route}/`;

  // await fs.mkdir(`./dist/${outputPath}`, { recursive: true });

  await fs.mkdir(distRoot, { recursive: true });
  await fs.writeFile(new URL(`${distRoot}/index.html`, import.meta.url), `
    <!DOCTYPE html>
    <html lang="en" prefix="og:http://ogp.me/ns#">
    
      <head>
        <title>Web Components Compiler (WCC)</title>
        <meta property="og:title" content="Web Components Compiler (WCC)"/>

      </head>

      <body>

        ${html}

      </body>
    </html>
  `.trim());
  // }
}

init();