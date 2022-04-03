// https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
class ShadowRoot {
  constructor(options) {
    console.debug('ShadowRoot constructor');
    this.mode = options.mode || 'closed';
    this.innerHTML = '';
  }
};

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
class HTMLElement {
  constructor() {
    console.debug('HTMLElement::constructor');
    this.shadowRoot = null;
    this.innerHTML = '';
  }

  attachShadow(options) {
    console.debug('HTMLElement::attachShadow');
    this.shadowRoot = new ShadowRoot(options);

    return this.shadowRoot;
  }

  connectedCallback() {
    console.debug('HTMLElement::connectedCallback');
    this.innerHTML = this.shadowRoot.innerHTML || this.innerHTML;
  }
}

// https://web.dev/declarative-shadow-dom/#hydration
// class HydrateElement extends HTMLElement {
//   constructor() {
//     super();
//     console.debug('HydrateElement constructor');
//   }
// }
/*<style>
  x-foo:not(:defined) > * {
    display: none;
  }
</style>*/

globalThis.HTMLElement = HTMLElement;