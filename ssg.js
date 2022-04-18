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
  const { html, assets } = await renderToString(new URL(`${pagesRoot}/${entry}`, import.meta.url), false);

  const lazyJs = [];
  const eagerJs = [];

  for(const asset in assets) {
    const a = assets[asset];

    a.tagName = asset;

    if(a.moduleURL.href.endsWith('.js')) {
      if(a.hydrate === 'lazy') {
        lazyJs.push(a)
      } else {
        eagerJs.push(a)
      }
    }
  }

  // bundle / copy dependency files
  await fs.writeFile(new URL(`${distRoot}/${entry.replace('.js', '.html')}`, import.meta.url), `
    <!DOCTYPE html>
    <html>
      <head>
        <title>WCC - SSG</title>

        ${
          eagerJs.map(script => {
            return `<script type="module" src="${script.moduleURL.pathname.replace(process.cwd(), '')}"></script>`
          }).join('\n')
        }

        ${
          lazyJs.map(script => {
            return `
              <script type="module">
                let initialized = false;

                window.addEventListener('load', () => {
                  let options = {
                    root: null,
                    rootMargin: '20px',
                    threshold: 1.0
                  }

                  let callback = (entries, observer) => {
                    entries.forEach(entry => {
                      console.debug({ entry })
                      if(!initialized && entry.isIntersecting) {
                        alert('Intersected ${script.tagName}, time to hydrate!!!');
                        initialized = true;
                        import('${script.moduleURL.pathname.replace(process.cwd(), '')}')
                      }
                    });
                  }

                  let observer = new IntersectionObserver(callback, options);
                  let target = document.querySelector('${script.tagName}');

                  observer.observe(target);
                })
              </script>
            `
          }).join('\n')
        }
      </head>
      <body>
        ${html}

        <script type="module">
          // import PageEntry from '${pagesRoot}/${entry}';
        </script>
      </body>
    </html>
  `.trim())
}