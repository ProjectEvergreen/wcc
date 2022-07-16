// static header and footer
// dynamic TODO list
import fs from 'node:fs/promises';
import path from 'path';
import { renderToString } from './src/wcc.js';

async function init() {
  const todoAppPath = new URL('./todo-app/app.jsx', import.meta.url);
  const outputPath = './sandbox';
  const { html, metadata } = await renderToString(todoAppPath);

  await fs.rm(outputPath, { recursive: true, force: true });
  await fs.mkdir(outputPath, { recursive: true });
  await Promise.all(Object.keys(metadata).map(async (key) => {
    const filepath = metadata[key].moduleURL.pathname.replace(`${process.cwd()}/todo-app/`, '');

    await fs.mkdir(path.dirname(path.join(outputPath, filepath)), { recursive: true });
    await fs.writeFile(path.join(outputPath, filepath.replace('.jsx', '.js')), metadata[key].source);
  }));

  await fs.writeFile(new URL(`${outputPath}/index.html`, import.meta.url), `
    <!DOCTYPE html>
    <html lang="en" prefix="og:http://ogp.me/ns#">

      <head>
        <title>WCC - TODO App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <script type="module">
          ${metadata['todo-app'].source.replace('.jsx', '.js')}
        </script>
      </head>

      <body>
        ${html}
      </body>
    </html>
  `);
}

init();