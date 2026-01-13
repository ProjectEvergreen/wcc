---
collection: nav
order: 1
imports:
  - ../styles/home.css
  - ../components/banner-splash/banner-splash.tsx type="module" data-gwd-opt="static"
  - ../components/banner-cta/banner-cta.tsx type="module" data-gwd-opt="static"
  - ../components/ctc-button/ctc-button.tsx type="module"
---

<wcc-banner-splash></wcc-banner-splash>

<wcc-banner-cta></wcc-banner-cta>

## How It Works

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

Get static HTML! 🎉

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

<!-- TODO: -->

## Capabilities

<!-- TODO: -->
