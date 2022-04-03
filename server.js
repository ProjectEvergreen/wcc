import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import { renderToString } from './lib/wcc.js';
import HomePage from './www/index.js';

const app = fastify({ logger: true });

app.register(fastifyStatic, {
  root: new URL('./www', import.meta.url).pathname,
})

app.get('/', async (request, reply) => {
  const page = await renderToString(HomePage);

  reply
    .header('Content-Type', 'text/html; charset=utf-8')
    .send(`
      <html>
        <head>
          <title>WCC</title>
        </head>
        <body>
          <h1>Hello World</h1>

          <page-entry>
            ${page}
          </page-entry>

          <script type="module">
            import PageEntry from './index.js';

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