class ShadowRoot {
  constructor(options) {
    console.debug('ShadowRoot constructor');
    this.mode = options.mode || 'closed';
    this.innerHTML = '';
  }
};

class HTMLElement {
  constructor() {
    console.debug('HTMLElement::constructor');
    this.shadowRoot = {};
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

// class HydrateElement extends HTMLElement {
//   constructor() {
//     super();
//     console.debug('HydrateElement constructor');
//   }
// }

globalThis.HTMLElement = HTMLElement;