---
collection: nav
order: 1
imports:
  - ../styles/home.css
  - ../components/banner-splash/banner-splash.tsx type="module" data-gwd-opt="static"
  - ../components/banner-cta/banner-cta.tsx type="module" data-gwd-opt="static"
  - ../components/ctc-button/ctc-button.tsx type="module"
  - ../components/feature-box/feature-box.tsx type="module" data-gwd-opt="static"
  - ../components/capability-box/capability-box.tsx type="module" data-gwd-opt="static"
---

<wcc-banner-splash></wcc-banner-splash>

<wcc-banner-cta></wcc-banner-cta>

## How It Works

WCC supports server-rendering of standard Web Components, generating HTML directly from your custom element definitions.

### Step 1

Create a custom element

```js
const template = document.createElement('template');

template.innerHTML = `
  <style>
    footer {
      color: #efefef;
      background-color: #192a27;
    }
  </style>

  <footer>
    <h4>My Blog &copy; ${new Date().getFullYear()}</h4>
  </footer>
`;

export default class Footer extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

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
      footer {
        color: #efefef;
        background-color: #192a27;
      }
    </style>

    <footer>
      <h4>My Blog &copy; 2026</h4>
    </footer>
  </template>
</wcc-footer>
```

## Capabilities

WCC aims to cover a reasonable set of DOM APIs to help facilitate server-rendering of your Web Components.

<div class="capabilities-container">

  <wcc-capability-box heading="constructor">
    <p>Standard HTMLElement constructor</p>
  </wcc-capability-box>

  <wcc-capability-box heading="connectedCallback">
    <p>Also supports async rendering</p>
  </wcc-capability-box>

  <wcc-capability-box heading="attachShadow">
    <p>Declarative Shadow DOM</p>
  </wcc-capability-box>

  <wcc-capability-box heading="< template >">
    <p>Template element support (createElement)</p>
  </wcc-capability-box>

  <wcc-capability-box heading="CSSStyleSheet">
    <p>Constructable Stylesheets shim</p>
  </wcc-capability-box>

  <wcc-capability-box heading="[get|set|has]Attribute">
    <p>Attribute handling</p>
  </wcc-capability-box>

  <wcc-capability-box heading="innerHTML">
    <p>Light DOM supported (aka. HTML Web Components)</p>
  </wcc-capability-box>

  <wcc-capability-box heading="addEventListener">
    <p>Handled as a no-op</p>
  </wcc-capability-box>

</div>

## Features

In addition to server rendering, WCC also supports these additional features.

<wcc-feature-box heading="JSX">

  <p>Custom JSX transform with the option to enable fine-grained reactivity compilation for interactive components.</p>
  
</wcc-feature-box>

<wcc-feature-box heading="TypeScript">

  <p>Combined with JSX, leverage TypeScript to achieve type-safe HTML as you author, including intellisense.</p>

</wcc-feature-box>

<wcc-feature-box heading="Pluggable">

  <p>Use WCC on its own, or integrate with your favorite framework, like <a href="https://www.greenwoodjs.dev">Greenwood</a>, <a href="https://github.com/ProjectEvergreen/astro-wcc">Astro</a>, or <a href="https://github.com/ProjectEvergreen/eleventy-plugin-wcc/">11ty</a>.</p>

</wcc-feature-box>
