import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import { renderToString } from './lib/wcc.js';

const app = fastify({ logger: false });

app.register(fastifyStatic, {
  root: new URL('./www', import.meta.url).pathname,
  prefix: '/www'
})
app.register(fastifyStatic, {
  root: new URL('./lib', import.meta.url).pathname,
  prefix: '/lib',
  decorateReply: false
})

app.get('/*', async (request, reply) => {
  const { url } = request;
  const pageRoute = url === '/'
    ? '/index'
    : url;

  console.debug({ url });
  console.debug({ pageRoute })

  const html = await renderToString(new URL(`./www${pageRoute}.js`, import.meta.url));

  reply
    .header('Content-Type', 'text/html; charset=utf-8')
    .send(`
      <html>
        <head>
          <title>WCC</title>
        </head>
        <body>
          <page-entry>
            ${html}
          </page-entry>

          <script type="module">
            import { HydrateElement } from './lib/hydrate-element.js';
            window.HydrateElement = HydrateElement;
          </script>

          <script type="module">
            import PageEntry from './www${pageRoute}.js';

            customElements.define('page-entry', PageEntry);
          </script>
        </body>
      </html>
    `);
});

const start = async () => {
  try {
    await app.listen(3000)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()