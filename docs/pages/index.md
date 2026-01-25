---
collection: nav
order: 1
imports:
  - ../styles/home.css
  - ../components/banner-splash/banner-splash.tsx type="module" data-gwd-opt="static"
  - ../components/banner-cta/banner-cta.tsx type="module" data-gwd-opt="static"
  - ../components/ctc-button/ctc-button.tsx type="module"
  - ../components/feature-box/feature-box.tsx type="module" data-gwd-opt="static"
---

<wcc-banner-splash></wcc-banner-splash>

<wcc-banner-cta></wcc-banner-cta>

## How It Works

WCC supports server-rendering of web standard Web Components; generating HTML directly from your custom element definitions.

### Step 1

Create a custom element

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

### Step 2

Run it through WCC

<!-- prettier-ignore-start -->

```js
import { renderToString } from 'wc-compiler';

const { html } = await renderToString(
  new URL('./path/to/footer.js', import.meta.url)
);
```

<!-- prettier-ignore-end -->

### Step 3

Get static HTML 🎉

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
      <h4>My Blog &copy; 2026</h4>
    </footer>
  </template>
</wcc-footer>
```

## Features

In addition to server rendering, WCC also features these developer ergonomics

<wcc-feature-box heading="< / > JSX">

  <p>Custom JSX transform with the option to enabled fine-grained reactivity for interactive components.</p>
  
</wcc-feature-box>

<wcc-feature-box heading="[TS] TypeScript">

  <p>Combined with JSX, leverage TypeScript to achieve type-safe HTML as you author, including intellisense.</p>

</wcc-feature-box>

<wcc-feature-box heading="{ ... } Pluggable">

  <p>Use WCC on its own, or integrate with your favorite framework, like <a href="https://www.greenwoodjs.dev">Greenwood</a>, <a href="https://github.com/ProjectEvergreen/astro-wcc">Astro</a>, or <a href="https://github.com/ProjectEvergreen/eleventy-plugin-wcc/">11ty</a>.</p>

</wcc-feature-box>

## Capabilities

<!-- TODO: -->
