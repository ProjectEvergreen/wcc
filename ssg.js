import fs from 'node:fs/promises';
import fse from 'fs-extra';
import { renderToString } from './lib/wcc.js';

const distRoot = './dist';
const pagesRoot = './www/pages';
const entries = await fs.readdir(new URL(pagesRoot, import.meta.url));

await fs.rm(distRoot, { recursive: true, force: true });
await fs.mkdir('./dist',  { recursive: true });
await fse.copy('./www/assets', `${distRoot}/www/assets`)
await fse.copy('./www/components', `${distRoot}/www/components`)
await fse.copy('./www/pages', `${distRoot}/www/pages`)

for (const entry of entries.filter(entry => entry.endsWith('.js'))) {
  const { html } = await renderToString(new URL(`${pagesRoot}/${entry}`, import.meta.url), false);

  // bundle / copy dependency files
  await fs.writeFile(new URL(`${distRoot}/${entry.replace('.js', '.html')}`, import.meta.url), `
    <!DOCTYPE html>
    <html>
      <head>
        <title>WCC</title>
      </head>
      <body>
        ${html}

        <script type="module">
          import PageEntry from '${pagesRoot}/${entry}';
        </script>
      </body>
    </html>
  `.trim())
}