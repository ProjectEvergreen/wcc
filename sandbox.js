import fs from 'node:fs/promises';
import { renderFromHTML } from './src/wcc.js';

const clientSideComponents = ['card.js'];

async function init() {
  const distRoot = new URL('./dist/', import.meta.url);
  const sandboxRoot = new URL('./sandbox/', import.meta.url); // './sandbox';
  const sandboxHtml = await fs.readFile(new URL('./index.html', sandboxRoot), 'utf-8');
  const components = await fs.readdir(new URL('./components/', sandboxRoot));
  const componentsUrls = components.map(component => new URL(`./components/${component}`, sandboxRoot));
  const interactiveComponents = components.filter(component => clientSideComponents.includes(component));
  const { html } = await renderFromHTML(sandboxHtml, componentsUrls);
  const scriptTags = interactiveComponents.map(component => {
    return `<script type="module" src="./components/${component}"></script>`;
  }).join('\n');

  for (const component of interactiveComponents) {
    const source = new URL(`./components/${component}`, sandboxRoot);
    const destination = new URL(`./components/${component}`, distRoot);

    await fs.mkdir(new URL('./components/', distRoot), { recursive: true });
    await fs.copyFile(source, destination);
  }

  await fs.mkdir(distRoot, { recursive: true });
  await fs.writeFile(new URL('./index.html', distRoot), `
    <!DOCTYPE html>
    <html lang="en" prefix="og:http://ogp.me/ns#">

      <head>
        <title>WCC Sandbox</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta charset="utf-8">
        <script>
          document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
          ':35729/livereload.js?snipver=1"></' + 'script>')
        </script>

        ${scriptTags}

        <style>
          h1, h2, p {
            text-align: center;
          }

          h2 {
            color: blue;
          }
          
          pre {
            width: 50%;
            margin: 0 auto;
            text-align: center;
          }
        </style>
      </head>

      <body>

        ${html}

      </body>
    </html>
  `.trim());
}

init();