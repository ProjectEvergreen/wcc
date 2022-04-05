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

const customElementsRegistry = {};

globalThis.HTMLElement = HTMLElement;
globalThis.customElements = {
  define: (tagName, BaseClass) => {
    console.debug('customElements.define => ', tagName);
    customElementsRegistry[tagName] = BaseClass;
  },
  get: (tagName) => {
    console.debug('customElements.get => ', tagName);
    return customElementsRegistry[tagName];
  }
}

const HydrateElement = await import('./hydrate-element.js').HydrateElement;
globalThis.HydrateElement = HydrateElement;