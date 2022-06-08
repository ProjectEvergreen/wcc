# wcc

<img src="https://merry-caramel-524e61.netlify.app/assets/wcc-logo.png" width="30%"/>

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

## Installation

**WCC** runs on NodeJS and can be installed from npm.

```shell
$ npm install wc-compiler --save-dev
```

## Documentation

See our [website](https://merry-caramel-524e61.netlify.app/) for API docs and examples.

## Motivation

**WCC** is not a static site generator, framework or bundler.  It is focused on producing raw HTML from Web Components with the intent of being easily integrated into a site generator or framework, like [**Greenwood**](https://github.com/ProjectEvergreen/greenwood/), the original motivation for creating [this project](https://github.com/ProjectEvergreen/greenwood/issues/935).

In addition, **WCC** hopes to provide a surface area to explore patterns around [streaming](https://github.com/ProjectEvergreen/wcc/issues/5) and serverless rendering, as well as acting as a test bed for the [Web Components Community Groups](https://github.com/webcomponents-cg) discussions around community protocols, like [hydration](https://github.com/ProjectEvergreen/wcc/issues/3).