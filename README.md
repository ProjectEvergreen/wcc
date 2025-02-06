<img src="https://merry-caramel-524e61.netlify.app/assets/wcc-logo.png" width="30%"/>

# Web Components Compiler (WCC)

[![Netlify Status](https://api.netlify.com/api/v1/badges/e718eac2-b3bc-4986-8569-49706a430beb/deploy-status)](https://app.netlify.com/sites/merry-caramel-524e61/deploys)
[![GitHub release](https://img.shields.io/github/tag/ProjectEvergreen/wcc.svg)](https://github.com/ProjectEvergreen/wcc/tags)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/ProjectEvergreen/wcc/master/LICENSE.md)
[![NodeJS compatibility](https://img.shields.io/node/v/wc-compiler.svg)](https://nodejs.org/en/about/previous-releases")
[![Discord Chat](https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord)](https://www.greenwoodjs.dev/discord/)

> _Experimental Web Components compiler.  It's Web Components all the way down!_  🐢

## How It Works

1. Write a Web Component
    ```js
    const template = document.createElement('template');

    template.innerHTML = `
      <style>
        .footer {
          color: white;
          background-color: #192a27;
        }
      </style>

      <footer class="footer">
        <h4>My Blog &copy; ${new Date().getFullYear()}</h4>
      </footer>
    `;

    class Footer extends HTMLElement {
      connectedCallback() {
        if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' });
          this.shadowRoot.appendChild(template.content.cloneNode(true));
        }
      }
    }

    export default Footer;

    customElements.define('wcc-footer', Footer);
    ```
1. Run it through the compiler
    ```js
    import { renderToString } from 'wc-compiler';

    const { html } = await renderToString(new URL('./path/to/component.js', import.meta.url));
    ```
1. Get HTML!
    ```html
    <wcc-footer>
      <template shadowrootmode="open">
        <style>
          .footer {
            color: white;
            background-color: #192a27;
          }
        </style>

        <footer class="footer">
          <h4>My Blog &copy; 2022</h4>
        </footer>
      </template>
    </wcc-footer>
    ```

## Installation

**WCC** runs on NodeJS and can be installed from npm.

```shell
$ npm install wc-compiler --save-dev
```

### CommonJS

If you need CommonJS support, a separate pre-bundled (with Rollup) distribution of **WCC** is available at _dist/wcc.dist.cjs_.  Example:
```js
const { renderToString } = require('wc-compiler/dist/wcc.dist.cjs');
```

## Documentation

See our [website](https://merry-caramel-524e61.netlify.app/) for API docs and examples.

## Motivation

**WCC** is not a static site generator, framework or bundler.  It is designed with the intent of being able to produce raw HTML from standards compliant Web Components and easily integrated _into_ a site generator or framework, like [**Greenwood**](https://www.greenwoodjs.dev).  The Project Evergreen team also maintains similar integrations for [**Eleventy**](https://github.com/ProjectEvergreen/eleventy-plugin-wcc/) and [Astro](https://github.com/ProjectEvergreen/astro-wcc).

In addition, **WCC** hopes to provide a surface area to explore patterns around [streaming](https://github.com/ProjectEvergreen/wcc/issues/5), [serverless and edge rendering](https://github.com/thescientist13/web-components-at-the-edge), and as acting as a test bed for the [Web Components Community Groups](https://github.com/webcomponents-cg)'s discussions around community protocols, like [hydration](https://github.com/ProjectEvergreen/wcc/issues/3).
