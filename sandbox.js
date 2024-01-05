import fs from 'node:fs/promises';
import { renderFromHTML } from './src/wcc.js';

const clientSideComponents = [
  'card.js'
];

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
  await fs.writeFile(new URL('./index.html', distRoot), html.replace('</head>', `
      ${scriptTags}
    </head>
  `.trim()));
}

init();