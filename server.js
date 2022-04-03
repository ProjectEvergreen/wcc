import fastify from 'fastify';
import { renderToString } from './lib/wcc.js';
import HomePage from './www/index.js';

const app = fastify({ logger: true });

// Declare a route
app.get('/', async (request, reply) => {
  const page = await renderToString(HomePage);
  // console.debug(renderToString(HomePage));

  reply
    .header('Content-Type', 'text/html; charset=utf-8')
    .send(`
      <html>
        <body>
          <h1>Hello World</h1>
          ${page}
        </body>
      </html>
    `);
});

// Run the server!
const start = async () => {
  try {
    await app.listen(3000)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()