---
layout: docs
collection: nav
order: 2
tocHeading: 2
---

# Docs

Below are the various APIs and capabilities of WCC.

## API

### renderToString

This function takes a `URL` "entry point" to a JavaScript file that defines a custom element, and returns the static HTML output of its rendered contents.

<!-- eslint-disable no-unused-vars -->

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

You can also manually set `innerHTML` of Shadow Root if you don't want to use a template element

```js
// index.js
import './components/footer.js';
import './components/header.js';

class Home extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :root {
            --accent: #367588;
          }
        </style>

        <wcc-header></wcc-header>

        <main>
          <h1>My Website</h1>
        </main>

        <wcc-footer></wcc-footer>
      `;
    }
  }
}

export default Home;
```

> _**Note**: **WCC** will wrap or not wrap your entry point's HTML in a custom element tag if you do or do not, respectively, include a `customElements.define` in your entry point. **WCC** will use the tag name you define as the custom element tag name in the generated HTML._
>
> You can opt-out of this by passing `false` as the second parameter to `renderToString`.
>
> <!-- eslint-disable no-unused-vars -->
>
> ```js
> const { html } = await renderToString(new URL('...'), false);
> ```

### renderFromHTML

This function takes a string of HTML and an array of any top-level custom elements used in the HTML, and returns the static HTML output of the rendered content.

<!-- eslint-disable no-unused-vars -->

```js
const { html } = await renderFromHTML(
  `
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
    new URL('./src/components/header.js', import.meta.url),
  ],
);
```

For example, even if `Header` or `Footer` use `import` to pull in additional custom elements, only the `Header` and `Footer custom elements used in the "entry" HTML are needed in the array.

## Metadata

`renderToString` and `renderFromHTML` return not only HTML, but also metadata about all the custom elements registered as part of rendering the entry file.

So for the given HTML:

```html
<wcc-header></wcc-header>

<h1>Hello World</h1>

<wcc-footer></wcc-footer>
```

And the following conditions:

1. _index.js_ does not define a tag of its own, e.g. using `customElements.define` (e.g. it is just a ["layout" component](/examples/#static-sites-ssg))
1. `<wcc-header>` imports `<wcc-navigation>`

The result would be:

```js
const { metadata } = await renderToString(new URL('./src/index.js', import.meta.url));

console.log({ metadata });
/*
 * {
 *   metadata: {
 *     'wcc-footer': { instanceName: 'Footer', moduleURL: [URL], isEntry: true },
 *     'wcc-header': { instanceName: 'Header', moduleURL: [URL],  isEntry: true },
 *     'wcc-navigation': { instanceName: 'Navigation', moduleURL: [URL],  isEntry: false }
 *   }
 * }
 */
```

## Progressive Hydration

To achieve an islands architecture implementation, if you add `hydration="true"` attribute to a custom element, e.g.

```html
<wcc-footer hydration="true"></wcc-footer>
```

This will be reflected in the returned `metadata` object from `renderToString`.

```js
/*
 * {
 *   metadata: {
 *     'wcc-footer': { instanceName: 'Footer', moduleURL: [URL], hydrate: 'true' },
 *     'wcc-header': { instanceName: 'Header', moduleURL: [URL] },
 *     'wcc-navigation': { instanceName: 'Navigation', moduleURL: [URL] }
 *   }
 * }
 *
 */
```

The benefit is that this hint can be used to defer loading of these scripts by using an [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) (for example), instead of eagerly loading it on page load using a `<script>` tag.

> _See [this example](/examples/#progressive-hydration) for more information._

## Data

WCC provide a couple mechanisms for data loading.

### Constructor Props

Often for frameworks that might have their own needs for data loading and orchestration, a top level "constructor prop" can be provided to `renderToString` as the final param. The prop will then be passed to the custom element's `constructor` when loading the module URL.

<!-- eslint-disable no-unused-vars -->

```js
const request = new Request({
  /* ... */
});
const { html } = await renderToString(new URL(moduleUrl), false, request);
```

This pattern plays really nice with file-based routing and SSR!

```js
export default class PostPage extends HTMLElement {
  constructor(request) {
    super();

    const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
    this.postId = params.get('id');
  }

  async connectedCallback() {
    const { postId } = this;
    const post = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`).then((resp) =>
      resp.json(),
    );
    const { title, body } = post;

    this.innerHTML = `
      <h2>${title}</h2>
      <p>${body}</p>
    `;
  }
}
```

### Data Loader

To support component-level data loading and hydration scenarios, a file with a custom element definition can also export a `getData` function to inject into the custom elements constructor at build time. This can be serialized right into the component's Shadow DOM!

For example, you could preload a counter component with an initial counter state, which would also come through the `constructor`.

<!-- eslint-disable no-unused-vars -->

```js
class Counter extends HTMLElement {
  constructor(props = {}) {
    super();

    this.count = props.count;
    this.render();
  }

  // setup your shadow root ...

  render() {
    this.shadowRoot.innerHTML = `
      <script type="application/json">
        ${JSON.stringify({ count: this.count })}
      </script>

      <div>
        <button id="inc">Increment</button>
        <span>Current Count: <span id="count">${this.count}</span></span>
        <button id="dec">Decrement</button>
      </div>
    `;
  }
}

export async function getData() {
  return {
    count: Math.floor(Math.random() * (100 - 0 + 1) + 0),
  };
}
```

## Conventions

- Make sure to define your custom elements with `customElements.define`
- Make sure to include a `export default` for your custom element base class
- Avoid [touching the DOM in `constructor` methods](https://twitter.com/techytacos/status/1514029967981494280)

## TypeScript

TypeScript is supported through "type stripping", which is effectively just removing all the TypeScript and leaving only valid JavaScript, before handing off to WCC to do its compiling.

```ts
interface User {
  name: string;
}

export default class Greeting extends HTMLElement {
  connectedCallback() {
    const user: User = {
      name: this.getAttribute('name') || 'World',
    };

    this.innerHTML = `
      <h3>Hello ${user.name}! 👋</h3>
    `;
  }
}

customElements.define('wcc-greeting', Greeting);
```

### Prerequisites

There are of couple things you will need to do to use WCC with TypeScript parsing:

1. NodeJS version needs to be >= `22.6.0`
1. You will need to use the _.ts_ extension
1. You'll want to enable the [`erasableSyntaxOnly`](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/#the---erasablesyntaxonly-option) flag in your _tsconfig.json_

> If you're feeling adventurous, you can use NodeJS **>=23.x** and omit the `--experimental-strip-types` flag. Keep an eye on this PR for when unflagged type-stripping support may come to Node LTS 22.x. 👀

## JSX

> ⚠️ _Very Experimental!_

Even more experimental than WCC is the option to author a rendering function for native `HTMLElements`, that can compile down to a zero run time, web ready custom element! It handles resolving event handling and `this` references and can manage some basic re-rendering lifecycles.

### Example

Below is an example of what is possible right now demonstrated through a [Counter component](https://github.com/thescientist13/greenwood-counter-jsx).

```tsx
export default class Counter extends HTMLElement {
  count: number;

  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    this.render(); // this is required
  }

  increment() {
    this.count += 1;
    this.render();
  }

  decrement() {
    this.count -= 1;
    this.render();
  }

  render() {
    const { count } = this;

    return (
      <div style="color:red;">
        <button onclick={(this.count -= 1)}> -</button>
        <span>
          You have clicked <span class="red">{count}</span> times
        </span>
        <button onclick={this.increment}> +</button>
        <button onclick={this.decrement}> +</button>
      </div>
    );
  }
}

customElements.define('wcc-counter', Counter);
```

A couple things to observe in the above example:

- The `this` reference is correctly bound to the `<wcc-counter>` element's state. This works for both `this.count` and the event handler, `this.increment`.
- No need for `className`! `class` just works ™️
- The `style` attribute is just a string, no need to pass an object (e.g. `style={{ color: "red" }})`)
- `this.count` will know it is a member of the `<wcc-counter>`'s state, and so will re-run `this.render` automatically in the compiled output.
- Event handlers need to manage their own render function updates.

> There is an [active discussion tracking features](https://github.com/ProjectEvergreen/wcc/discussions/84) and [issues in progress](https://github.com/ProjectEvergreen/wcc/issues?q=is%3Aopen+is%3Aissue+label%3AJSX) to continue iterating on this, so please feel free to try it out and give us your feedback!

### Prerequisites

There are of couple things you will need to do to use WCC with JSX:

1. NodeJS version needs to be >= `20.10.0`
1. You will need to use the _.jsx_ extension
1. Requires the `--import` flag when invoking NodeJS
   ```shell
   $ NODE_OPTIONS="--import wc-compiler/register" node your-script.js
   ```

> _See our [example's page](/examples#jsx) for some usages of WCC + JSX._ 👀

### TSX

TSX (.tsx) file are also supported and your HTML will also be **type-safe**. You'll need to configure JSX in your _tsconfig.json_ by adding these required (and recommend) entries into to your `compilerOptions` settings:

<!-- prettier-ignore-start -->

```json5
{
  "compilerOptions": {
    // required options
    "jsx": "preserve",
    "jsxImportSource": "wc-compiler",
    "lib": ["DOM"],

    // additional recommended options
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true
  }
}
```

<!-- prettier-ignore-end -->

If you create your own custom elements and use them in your TSX components, you'll need to define your own `interface` for them:

```ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'my-counter': {
        count?: number;
      };
    }
  }
}
```

### Declarative Shadow DOM

To opt-in to Declarative Shadow DOM with JSX, you will need to signal to the WCC compiler your intentions so it can accurately mount from a `shadowRoot` on the client side. To opt-in, simply make a call to `attachShadow` in your `connectedCallback` method before calling `render`. That's it!

Using, the Counter example from above, we would amend it like so:

```js
export default class Counter extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' }); // this is required for DSD support
      this.render();
    }
  }

  // ...
}

customElements.define('wcc-counter', Counter);
```

### (Inferred) Attribute Observability

An optional feature supported by JSX based compilation is `inferredObservability`. With this enabled, WCC will read any `this` member references in your component's `render` function and map each member instance to:

1. an entry in the `observedAttributes` array
1. automatically handle `attributeChangedCallback` updates

So taking the above counter example, and opting in to this feature, we just need to enable the `inferredObservability` option in the component by exporting it as a `const`:

<!-- prettier-ignore-start -->

```jsx
export const inferredObservability = true;

export default class Counter extends HTMLElement {
  // ...

  render() {
    const { count } = this;

    // note that {count} has to be wrapped in its own HTML tag
    return (
      <div>
        <button onclick={this.count -= 1}> -</button>
        <span>
          You have clicked <span class="red">{count}</span> times
        </span>
        <button onclick={this.increment}> +</button>
      </div>
    );
  }
}
```

<!-- prettier-ignore-end -->

And so now when the attribute is set on this component, the component will re-render automatically using fine-grained updates; no need to write out `observedAttributes` or `attributeChangedCallback`!

```html
<wcc-counter count="100"></wcc-counter>
```

Some notes / limitations:

- Please be aware of the above linked discussion and issue filter which is tracking any known bugs / feature requests / open items related to all things WCC + JSX.
- This automatically reflects properties used in the `render` function to attributes, so [YMMV](https://dictionary.cambridge.org/us/dictionary/english/ymmv).
