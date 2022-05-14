# wcc

[![Netlify Status](https://api.netlify.com/api/v1/badges/e718eac2-b3bc-4986-8569-49706a430beb/deploy-status)](https://app.netlify.com/sites/merry-caramel-524e61/deploys)
[![GitHub release](https://img.shields.io/github/tag/thescientist13/wcc.svg)](https://github.com/thescientist13/wcc/tags)
![GitHub Actions status](https://github.com/thescientist13/wcc/workflows/Master%20Integration/badge.svg)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/thescientist13/wcc/master/LICENSE.md)

Experimental native Web Components compiler. (`<w⚙️⚙️/>`)

> _It's Web Components all the way down._  🐢

## Overview

**Web Components Compiler (WCC)** is a NodeJS package designed to make server-side rendering (SSR) of native Web Components easier.  It can render (within reason 😅) your Web Component into static HTML leveraging [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom/).

It is not a static site generator or framework.  It is focused on producing raw HTML from Web Components with the intent of being easily _integrated_ into a site generator or framework.  

> _The original motivation for this project was to create a [purpose built, lighter weight, alternative to puppeteer for SSR of `HTMLElement`](https://github.com/ProjectEvergreen/greenwood/issues/926) for the project [**Greenwood**](https://www.greenwoodjs.io/)._

In addition, WCC hopes to provide a surface area to explore patterns around [streaming](https://github.com/thescientist13/wcc/issues/5) and serverless rendering, as well as acting as a test bed for the [Web Components Community Groups](https://github.com/webcomponents-cg) discussions around community protocols, like [hydration](https://github.com/thescientist13/wcc/issues/3). 

## Key Features

1. Supports the following `HTMLElement` lifecycles and methods on the server side
    - `constructor`
    - `connectedCallback`
    - `attachShadow`
    - `innerHTML`
    - `[get|set|has]Attribute`
1. Recursive rendering of nested custom elements
1. Optional Declarative Shadow DOM (for producing purely content driven static pages)
1. Metadata and runtime hints to support progressive hydration and lazy loading strategies

## Installation

**wcc** can be installed from npm.

```shell
$ npm install wc-compiler --save-dev
```

## Usage

WCC exposes a few utilities to render your Web Components.  Below is one example, with [full docs and more examples](https://wcc.greenwoodjs.io) available on the website.

1. Given a custom element like so:
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

1. Using NodeJS, create a file that imports `renderToString` and provide it the path to your web component
    ```js
    import { renderToString } from 'wc-compiler';

    const { html } = await renderToString(new URL('./path/to/footer.js', import.meta.url));

    console.debug({ html })
    ```

1. You will get the following html output that can be used in conjunction with your preferred site framework or templating solution.
    ```html
    <wcc-footer>
      <template shadowroot="open">
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


> _**Make sure to test in Chrome, or other Declarative Shadow DOM compatible browser, otherwise you will need to include the [DSD polyfill](https://web.dev/declarative-shadow-dom/#polyfill).**_