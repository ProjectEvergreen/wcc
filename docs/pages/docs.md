# Documentation


## API

### `renderToString`

This function takes a `URL` to a JavaScript file that defines a custom element, and returns the static HTML output of its rendered contents.

```js
const { html } = await renderToString(new URL('./src/index.js', import.meta.url));
```

#### Options

`renderToString` also supports a second parameter that is an object, called `options`, which supports the following configurations:

- `lightMode`: For more static outcomes (e.g. no declarative shadow DOM), this option will omit all wrapping `<template shadowroot="...">` tags when rendering out custom elements.  Useful for static sites or working with global CSS libraries.

## Metadata

`renderToString` returns not only HTML, but also metadata about all the custom elements registered as part of rendering the top level custom element.

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

> _See our [examples page](/examples/) for more info._


## `getData`

To further support SSR and hydration scenarios where data is involved, a file with a custom element definition can also export a `getData` function to inject into the custom elements constructor at server render time, as "props".  This can be serialized right into the component's Shadow DOM!

For example, you could preload a counter component with an initial counter state
```js
export async function getData() {
  return {
    count: Math.floor(Math.random() * (100 - 0 + 1) + 0)
  };
}
```

> _See our [examples page](/examples/) for more info._

## Conventions

- Make sure to define your custom elements with `customElements.define`
- Make sure to `export default` your custom element base class
- Avoid [touching the DOM in `constructor` methods](https://twitter.com/techytacos/status/1514029967981494280)