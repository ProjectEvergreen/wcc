import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import path from 'path';
import stream, { Readable } from 'stream';
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

function* renderPageStreaming(html, assets) {
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
        return `
          <link rel="preload" href="${script.moduleURL.pathname.replace(process.cwd(), '')}" as="script" crossorigin>
          <script type="module" src="${script.moduleURL.pathname.replace(process.cwd(), '')}"></script>
        `
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
    <h1>+++++++++++++Start of Stream++++++++++++++</h1>
    ${html}
    <h1>+++++++++++++Start of Stream++++++++++++++</h1>
  `
  
  yield `
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
    ${html}
  `

  yield `
    <h1>+++++++++++++End of Stream++++++++++++++</h1>
  `

  yield `
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

    // https://github.com/fastify/fastify/issues/805#issuecomment-369172154
    const buffer = new stream.Readable();
    buffer._read = ()=>{};

    for(const data of renderPageStreaming(html, assets)) {
      buffer.push(data);
    }

    buffer.push(null)

    reply.type('text/html').send(buffer)

    // TODO - related to favicon?
    // Promise may not be fulfilled with 'undefined' when statusCode is not 204",
    // "stack":"FastifyError: Promise may not be fulfilled with 'undefined' when statusCode is not 204
    // reply
    //   .header('Content-Type', 'text/html; charset=utf-8')
    //   .header('Transfer-Encoding', 'chunked')
    //   .send(Readable.from(await renderPage(html, assets)));
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