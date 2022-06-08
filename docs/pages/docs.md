# Documentation

## Table of contents

## API

### renderToString

This function takes a `URL` "entry point" to a JavaScript file that defines a custom element, and returns the static HTML output of its rendered contents.

```js
const { html } = await renderToString(new URL('./src/index.js', import.meta.url));
```

```js
// index.js
import './components/footer.js';
import './components/header.js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :root {
      --accent: #367588;
    }
  </style>

  <wcc-header></wcc-header>

  <main>
    <h1>My Blog Post</h1>
  </main>

  <wcc-footer></wcc-footer>
`;

class Home extends HTMLElement {

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export default Home;
```

> _**Note**: **WCC** will wrap or not wrap your _entry point's HTML_ in a custom element tag if you do or do not, respectively, include a `customElements.define` in your entry point.  **WCC** will use the tag name you define as the custom element tag name in the generated HTML._

### renderFromHTML

This function takes a string of HTML and an array of any top-level custom elements used in the HTML, and returns the static HTML output of the rendered content.

```js
const { html } = await renderFromHTML(`
  <html>
    <head>
      <title>WCC</title>
    </head>
    <body>
      <wcc-header></wcc-header>
      <h1>Home Page</h1>
      <wcc-footer></wcc-footer>
    </body>
  </html>
`,
[
  new URL('./src/components/footer.js', import.meta.url),
  new URL('./src/components/header.js', import.meta.url)
]);
```

For example, even if `Header` or `Footer` use `import` to pull in additional custom elements, only the `Header` and `Footer custom elements used in the "entry" HTML are needed in the array.

### Options

`renderToString` and `renderFromHTML` also supports a second and third parameter respectively, that is an object, called `options`
```js
// default values
{
  lightMode: false
}
```

It supports the following configuration(s):

- `lightMode`: For more static outcomes (e.g. no declarative shadow DOM), this option will omit all wrapping `<template shadowroot="...">` tags when rendering out custom elements.  Useful for static sites or working with global CSS libraries.


## Metadata

`renderToString` and `renderFromHTML` return not only HTML, but also metadata about all the custom elements registered as part of rendering the entry file.

```js
const { metadata } = await renderToString(new URL('./src/index.js', import.meta.url));

console.log({ metadata });
/*
 * {
 *   metadata: [
 *     'wcc-footer': { instanceName: 'Footer', moduleURL: [URL] },
 *     'wcc-header': { instanceName: 'Header', moduleURL: [URL] },
 *     'wcc-navigation': { instanceName: 'Navigation', moduleURL: [URL] }
 *   ]
 * }
 *
```

## Progressive Hydration

To achieve an islands architecture implementation, if you add `hydration="true"` attribute to a custom element, e.g.
```html
<wcc-footer hydration="true"></wcc-footer>
```

This will be reflected in the returned `metadata` array from `renderToString`.
```js
/*
 * {
 *   metadata: [
 *     'wcc-footer': { instanceName: 'Footer', moduleURL: [URL], hydrate: 'true' },
 *     'wcc-header': { instanceName: 'Header', moduleURL: [URL] },
 *     'wcc-navigation': { instanceName: 'Navigation', moduleURL: [URL] }
 *   ]
 * }
 *
```

The benefit is that this hint can be used to defer loading of these scripts by using an [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) (for example), instead of eagerly loading it on page load using a `<script>` tag.

> _See [this example](/examples/#progressive-hydration) for more information._


## Data

To further support SSR and hydration scenarios where data is involved, a file with a custom element definition can also export a `getData` function to inject into the custom elements constructor at server render time, as "props".  This can be serialized right into the component's Shadow DOM!

For example, you could preload a counter component with an initial counter state
```js
export async function getData() {
  return {
    count: Math.floor(Math.random() * (100 - 0 + 1) + 0)
  };
}
```

## Conventions

- Make sure to define your custom elements with `customElements.define`
- Make sure to include a `export default` for your custom element base class
- Avoid [touching the DOM in `constructor` methods](https://twitter.com/techytacos/status/1514029967981494280)