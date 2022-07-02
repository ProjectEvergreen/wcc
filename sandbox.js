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
        console.debug(\`'${metadata[key].source}'\`);

        ${metadata[key].source}
      </script>
    `;
  });

  await fs.rm(sandboxRoot, { recursive: true, force: true });
  await fs.mkdir(sandboxRoot, { recursive: true });
  await fs.writeFile(new URL(`${sandboxRoot}//index.html`, import.meta.url), `
    <!DOCTYPE html>
    <html lang="en" prefix="og:http://ogp.me/ns#">

      <head>
        <title>WCC - Sandbox</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        ${sources.join('\n')}
      </head>

      <body>
        <h1>WCC Sandbox</h1>

        ${tags.join('\n')}

        ${Object.keys(metadata).map(key => `<pre>${metadata[key].source}</pre>`).join('\n')}
      </body>
    </html>
  `.trim());
}

init();