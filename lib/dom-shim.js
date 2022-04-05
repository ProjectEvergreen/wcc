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
  }

  attachShadow(options) {
    console.debug('HTMLElement::attachShadow');
    this.shadowRoot = new ShadowRoot(options);

    return this.shadowRoot;
  }

  connectedCallback() {
    console.debug('HTMLElement::connectedCallback');
  }

  // https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md#serialization
  getInnerHTML(options) {
    return options.includeShadowRoots
      ? `
        <template shadowroot="${this.shadowRoot.mode}">
          ${this.shadowRoot.innerHTML}
        </template>
      `
      : this.shadowRoot.innerHTML
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