# Examples

Below are some example of how **WCC** is being used right now.

## Table of contents

## Server Rendering (SSR)

For the project [**Greenwood**](https://github.com/ProjectEvergreen/greenwood/), **WCC** is going to be used to provide a _Next.js_ like experience by allowing users to author [server-side routes using native custom elements](https://www.greenwoodjs.io/docs/server-rendering/#routes)!  ✨

```js
import '../components/card/card.js';
import fetch from 'node-fetch';

export default class ArtistsPage extends HTMLElement {
  async connectedCallback() {
    if (!this.shadowRoot) {
      const artists = await fetch('https://www.domain.com/api/artists').then(resp => resp.json());
      const html = artists.map(artist => {
        return `
          <wc-card>
            <h2 slot="title">${artist.name}</h2>
            <img slot="image" src="${artist.imageUrl}" alt="${artist.name}"/>
          </wc-card>
        `;
      }).join('');

      this.attachShadow({ mode: 'open' });
      this.innerHTML = html;
    }
  }

  ...
}
```

## Serverless and Edge Functions

In the talk [_"Web Components at the Edge"_](https://sched.co/11loQ) for OpenJS World 2022, **WCC** was leveraged for all the AWS Lambda serverless function and Netlify Edge function demos.  It also shows some clever ways to use **WCC** in more constrained runtime environments, like an edge runtime where something like `fs` might not be available.  See all the [code, slides and demos in GitHub](https://github.com/thescientist13/web-components-at-the-edge).  🚀

```js
import '../../node_modules/wc-compiler/src/dom-shim.js';

import Greeting from './components/greeting.js';

export default async function (request, context) {
  const countryCode = context.geo.country.code || 'UNKNOWN';
  const countryName = context.geo.country.name || 'UNKNOWN';
  const greeting = new Greeting(countryCode, countryName);

  greeting.connectedCallback();

  const response = new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <body>
        <wc-greeting>
          ${greeting.getInnerHTML({ includeShadowRoots: true })}
          <details slot="details">
            <pre>
              ${JSON.stringify(context.geo)}
            </pre>
          </details>
        </wc-greeting>
      </body>
    </html>
  `);

  response.headers.set('content-type', 'text/html');

  return response;
}
```

## Static Sites (SSG)

Using `innerHTML`, custom elements can be authored to not use Shadow DOM, which can be useful for a `Layout` or `App` component where that top level content specifically should _not_ be rendered in a shadow root, e.g. `<template>` tag.  What's nice about **WCC** is that by using `innerHTML` or `attachShadow`, you can opt-in to either on a per component basis, like is being done for [the **WCC** website](https://github.com/ProjectEvergreen/wcc/tree/master/docs).  In this case, the content is authored in markdown, but the layout, header, navigation, and footer are all custom elements rendered to static HTML.  🗒️

```js
// layout.js
import './components/footer.js';
import './components/header.js';

class Layout extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        :root {
          --accent: #367588;
        }

        body {
          display: flex;
          flex-direction: column;
        }

        main {
          max-width: 1200px;
          margin: 20px auto;
        }

        a:visited {
          color: var(--accent);
        }
      </style>

      <wcc-header></wcc-header>

      <main>
        <slot name="content"></slot>
      </main>

      <wcc-footer></wcc-footer>
    `;
  }
}

export default Layout;
```

## Progressive Hydration

Using the `metadata` information from a custom element with the `hydrate=true` attribute, you can use use the metadata with an [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to progressively load a custom element.  In this case, _handler.js_ builds `SliderComponent` from HTML and not only uses the `hydrate` attribute and metadata for lazy hydration, but also passes in the animated color via a CSS custom property set at build time!  🤯

See it in [action here](https://wc-at-the-edge.thegreenhouse.io/demo3) by scrolling to the bottom of the page and seeing the animation happen!  View [the code here in GitHub](https://github.com/thescientist13/web-components-at-the-edge/blob/main/serverless/get-demo3/index.mjs).

```js
// slider.js
const template = document.createElement('template');

template.innerHTML = `
  <style>
    h6 {
      color: var(--color-secondary);
      font-size: 25px;
    }

    h6.hydrated {
      animation-duration: 3s;
      animation-name: slidein;
    }

    @keyframes slidein {
      from {
        margin-left: 100%;
        width: 300%;
      }

      to {
        font-size: 25px;
      }
    }
  </style>

  <h6>This is a slider component.</h6>
`;

class SliderComponent extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    } else {
      const header = this.shadowRoot.querySelector('h6');

      header.style.color = this.getAttribute('color');
      header.classList.add('hydrated');
    }
  }
}

export { SliderComponent };
export default SliderComponent;

customElements.define('wc-slider', SliderComponent);
```

```js
// handler.js
import { renderFromHTML } from 'wc-compiler';

export async function handler() {
  const { html, metadata } = await renderFromHTML(`
    <wc-slider color="var(--color-accent)">
    </wc-slider>
  `);
  const lazyJs = [];

  for (const asset in assets) {
    const a = assets[asset];

    a.tagName = asset;

    if (a.moduleURL.href.endsWith('.js')) {
      if (a.hydrate === 'lazy') {
        lazyJs.push(a);
      }
    }
  }

  return {
    status: 200,
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            :root, :host {
              --color-primary: rgb(12, 36, 42);
              --color-secondary: rgb(110, 176, 6);
              --color-tertiary: rgb(110, 176, 6);
              --color-accent: rgb(250, 217, 28);
            }
          </style>
          ${
            lazyJs.map(script => {
              return `
                <script type="module">
                  let initialized = false;

                  window.addEventListener('load', () => {
                    const options = {
                      root: null,
                      rootMargin: '20px',
                      threshold: 1.0
                    }

                    const callback = (entries, observer) => {
                      entries.forEach(entry => {
                        if(!initialized && entry.isIntersecting) {
                          initialized = true;
                          import('${script.moduleURL.pathname.replace(process.cwd(), '')}')
                        }
                      });
                    }

                    const observer = new IntersectionObserver(callback, options);
                    const target = document.querySelector('${script.tagName}');

                    observer.observe(target);
                  })
                </script>
              `;
            }).join('\n')
          }
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
  };
}
```