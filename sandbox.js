import fs from 'node:fs/promises';
import { renderToString } from './src/wcc.js';

async function init() {
  const sandboxScriptPath = new URL('./test/cases/jsx/src/counter.jsx', import.meta.url);
  const sandboxScriptPathShadow = new URL('./test/cases/jsx/src/counter-shadow.jsx', import.meta.url);
  const sandboxRoot = './sandbox';
  const { metadata } = await renderToString(sandboxScriptPath);
  const { metadata: metaDataShadow } = await renderToString(sandboxScriptPathShadow);
  const allMeta = Object.assign({}, metadata, metaDataShadow);

  const tags = Object.keys(allMeta).map(key => {
    return `<${key}></${key}>`;
  });
  const sources = Object.keys(allMeta).map(key => {
    return `
      <script type="module">
        ${allMeta[key].source}
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

        <style>
          /* shadow version should intentionally not display the color */
          wcc-counter-jsx span#count, wcc-counter-jsx-shadow span#count {
            color: red;
          }
        </style>
      </head>

      <body>
        <h1>WCC Sandbox</h1>

        <h2>Control Groups</h2>
        <wcc-counter-control></wcc-counter-control>
        <wcc-counter-control-shadow></wcc-counter-control-shadow>

        <hr/>

        <h2>Transform Groups</h2>
        ${tags.join('\n')}

        <hr/>

        <h2>Transform Sources</h2>
        ${Object.keys(allMeta).map(key => `<pre>${allMeta[key].source}</pre>`).join('\n')}
      </body>
    </html>
  `);
}

init();