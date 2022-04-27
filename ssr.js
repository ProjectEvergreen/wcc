import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import { renderToString } from './src/wcc.js';

const app = fastify({ logger: true });
const port = 3000;

app.register(fastifyStatic, {
  root: new URL('./www', import.meta.url).pathname,
  prefix: '/www'
});
app.register(fastifyStatic, {
  root: new URL('./src', import.meta.url).pathname,
  prefix: '/src',
  decorateReply: false
});

app.get('/*', async (request, reply) => {
  const { url } = request;
  const pageRoute = url === '/' ? '/index' : url;
  const entryPoint = `./www/pages${pageRoute}.js`;

  console.debug({ url });
  console.debug({ pageRoute });
  console.debug({ entryPoint });

  const { html, assets } = await renderToString(new URL(entryPoint, import.meta.url), false);
  const lazyJs = [];
  const eagerJs = [];
  const hydrateJs = [];

  for (const asset in assets) {
    const a = assets[asset];

    a.tagName = asset;

    if (a.moduleURL.href.endsWith('.js')) {
      if (a.hydrate === 'lazy') {
        lazyJs.push(a);
      } else if(a.__hydrate__) {
        hydrateJs.push(a.__hydrate__);
      } else {
        eagerJs.push(a);
      }
    }
  }

  reply
    .header('Content-Type', 'text/html; charset=utf-8')
    .send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>WCC - SSR</title>
          
          <!-- <script src="./src/runtime.js"></script> -->

          ${
            hydrateJs.map(f => {
              return `
                <script type="module">
                  console.debug("${f}");
                </script>
              `
            })
          }

          ${
            eagerJs.map(script => {
              return `<script type="module" src="${script.moduleURL.pathname.replace(process.cwd(), '')}"></script>`;
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
              `;
            }).join('\n')
          }
        </head>
        <body>
          <!-- <page-entry> -->
            ${html}
          <!-- </page-entry> -->

          <script type="module">
            // import { HydrateElement } from './lib/hydrate-element.js';
            // window.HydrateElement = HydrateElement;
          </script>

          <script type="module">
            // import PageEntry from '${entryPoint}';

            // this and the pageEntry effectively double bootstrapping everything
            // so <page-entry> is not needed?
            // customElements.define('page-entry', PageEntry);
          </script>
        </body>
      </html>
    `.trim());
});

const start = async () => {
  try {
    await app.listen(port);
  } catch (err) {
    app.log.error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  }
};

start();