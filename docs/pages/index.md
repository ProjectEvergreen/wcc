# Introduction

**Web Components Compiler (WCC)** is a NodeJS package designed to make server-side rendering (SSR) of native Web Components easier.  It can render (within reason 😅) your Web Component into static HTML.  This includes support for [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom/).

## Installation

**WCC** can be installed from npm.

```shell
$ npm install wc-compiler --save-dev
```

## Key Features

1. Supports the following `HTMLElement` lifecycles and methods on the server side
    - `constructor`
    - `connectedCallback`
    - `attachShadow`
    - `innerHTML`
    - `[get|set|has]Attribute`
1. `<template>` / `DocumentFragment`
1. `addEventListener` (as a no-op)
1. Supports `CSSStyleSheet` (all methods act as no-ops)
1. TypeScript
1. Custom JSX / TSX parsing include **type-safe** HTML
1. Recursive rendering of nested custom elements
1. Metadata and runtime hints to support various progressive hydration and lazy loading strategies

> _It is recommended to reference [`globalThis`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis) instead of `window` for isomorphic Web Components_.

## Usage

**WCC** exposes a few utilities to render your Web Components.  See [our API docs](/docs) for all available features.

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

1. Using NodeJS, create a file that imports `renderToString` and provide it the path to your web component <!-- eslint-disable no-unused-vars -->
    ```js
    import { renderToString } from 'wc-compiler';

    const { html } = await renderToString(new URL('./path/to/footer.js', import.meta.url));
    ```

1. You will get the following HTML output that can be used in conjunction with your preferred site framework or templating solution.
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


> _**Make sure to test in Chrome, or other Declarative Shadow DOM compatible browser, otherwise you will need to include the [polyfill](https://web.dev/declarative-shadow-dom/#polyfill).**_