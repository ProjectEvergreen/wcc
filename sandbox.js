import fs from 'node:fs/promises';
import { renderToString } from './src/wcc.js';

async function init() {
  const sandboxScriptPath = new URL('./test/cases/jsx/src/counter.jsx', import.meta.url);
  const sandboxRoot = './sandbox';
  const { metadata } = await renderToString(sandboxScriptPath);

  const tags = Object.keys(metadata).map(key => {
    return `<${key}></${key}>`;
  });
  const sources = Object.keys(metadata).map(key => {
    return `
      <script type="module">
        ${metadata[key].source}
      </script>
    `;
  });
  const control = await fs.readFile(new URL('./test/cases/jsx/src/counter-control.js', import.meta.url), 'utf-8');

  await fs.rm(sandboxRoot, { recursive: true, force: true });
  await fs.mkdir(sandboxRoot, { recursive: true });
  await fs.writeFile(new URL(`${sandboxRoot}/index.html`, import.meta.url), `
    <!DOCTYPE html>
    <html lang="en" prefix="og:http://ogp.me/ns#">

      <head>
        <title>WCC - Sandbox</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <script type="module">
          ${control}
        </script>
        ${sources.join('\n')}
      </head>

      <body>
        <h1>WCC Sandbox</h1>

        <h2>Control Group</h2>
        <wcc-counter-control></wcc-counter-control>

        <hr/>

        <h2>Sources</h2>

        ${tags.join('\n')}
        ${Object.keys(metadata).map(key => `<pre>${metadata[key].source}</pre>`).join('\n')}
      </body>
    </html>
  `);
}

init();