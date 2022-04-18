import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import path from 'path';
import { Readable } from 'stream';
import { renderToString } from './lib/wcc.js';

const app = fastify({ logger: true });
const port = 3001;

app.register(fastifyStatic, {
  root: new URL('./www', import.meta.url).pathname,
  prefix: '/www'
})
app.register(fastifyStatic, {
  root: new URL('./lib', import.meta.url).pathname,
  prefix: '/lib',
  decorateReply: false
})

function* renderPageStreaming(html, assets, data) {
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

  yield `
    <!DOCTYPE html>
    <html>
      <head>
        <title>WCC - Streaming (SSR)</title>
  `;
  yield `
    ${
      eagerJs.map(script => {
        return `<script type="module" src="${script.moduleURL.pathname.replace(process.cwd(), '')}"></script>`
      }).join('\n')
    }
  `;
  yield `
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
  `;

  yield `
    </head>
    <body>
  `
  
  yield `
    ${html}
  `

  yield `
      </body>
    </html>
  `;
}

async function renderPage(html, assets, data) {
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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>WCC - Streaming SSR</title>
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
      </body>
    </html>
  `;
}

app.get('/*', async (request, reply) => {
  const { url } = request;
  
  if(path.extname(url) === '') {
    const pageRoute = url === '/' ? '/index' : url;
    const entryPoint = `./www/pages${pageRoute}.js`

    console.debug({ url });
    console.debug({ pageRoute })
    console.debug({ entryPoint })

    const { html, assets } = await renderToString(new URL(entryPoint, import.meta.url), false);
    // const contents = renderPage(html, assets);
    // const chunks = [];

    // for(const chunk of contents) {
    //   chunks.push(chunk)
    // }

    // console.debug({ chunks });

    // const readable = Readable.from(chunks)

    // console.debug({ readable });

    // TODO - related to favicon?
    // Promise may not be fulfilled with 'undefined' when statusCode is not 204",
    // "stack":"FastifyError: Promise may not be fulfilled with 'undefined' when statusCode is not 204
    reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .header('Transfer-Encoding', 'chunked')
      .send(Readable.from((await renderPage(html, assets))));
  }
});

const start = async () => {
  try {
    await app.listen(port)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()