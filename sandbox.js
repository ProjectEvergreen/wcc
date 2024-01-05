import fs from 'node:fs/promises';
import { renderFromHTML } from './src/wcc.js';

const clientSideComponents = [
  'card.js',
  'card.jsx'
];

async function init() {
  const distRoot = new URL('./dist/', import.meta.url);
  const sandboxRoot = new URL('./sandbox/', import.meta.url); // './sandbox';
  const sandboxHtml = await fs.readFile(new URL('./index.html', sandboxRoot), 'utf-8');
  const components = await fs.readdir(new URL('./components/', sandboxRoot));
  const componentsUrls = components.map(component => new URL(`./components/${component}`, sandboxRoot));
  const interactiveComponents = components.filter(component => clientSideComponents.includes(component));
  const { html, metadata } = await renderFromHTML(sandboxHtml, componentsUrls);
  const scriptTags = interactiveComponents.map(component => {
    const ext = component.split('.').pop();
    const outputName = ext === 'js'
      ? component
      : component.replace('.jsx', '-jsx.js');

    return `<script type="module" src="./components/${outputName}"></script>`;
  }).join('\n');

  for (const component of interactiveComponents) {
    const ext = component.split('.').pop();
    const outputName = ext === 'js'
      ? component
      : component.replace('.jsx', '-jsx.js');
    const source = new URL(`./components/${component}`, sandboxRoot);
    const destination = new URL(`./components/${outputName}`, distRoot);

    await fs.mkdir(new URL('./components/', distRoot), { recursive: true });

    if (ext === 'js') {
      await fs.copyFile(source, destination);
    } else {
      const key = `sb-${component.replace('.', '-')}`;

      for (const element in metadata) {
        if (element === key) {
          await fs.writeFile(destination, metadata[element].source);
        }
      }
    }
  }

  await fs.mkdir(distRoot, { recursive: true });
  await fs.writeFile(new URL('./index.html', distRoot), html.replace('</head>', `
      ${scriptTags}
    </head>
  `.trim()));
}

init();