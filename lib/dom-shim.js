// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
class EventTarget { }

// https://developer.mozilla.org/en-US/docs/Web/API/Node
// EventTarget <- Node
class Node extends EventTarget {
  constructor() {
    super();
    // console.debug('Node constructor');
  }

  cloneNode(deep) {
    return this;
  }

  appendChild(node) {
    this.innerHTML = this.innerHTML ? this.innerHTML += node.textContent : node.textContent;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Element
// EventTarget <- Node <- Element
class Element extends Node {
  constructor() {
    super();
    // console.debug('Element constructor');
    this.shadowRoot = null;
    this.innerHTML;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
// EventTarget <- Node <- Element <- HTMLElement
class HTMLElement extends Element {
  constructor() {
    super();
    // console.debug('HTMLElement::constructor');
  }

  attachShadow(options) {
    // console.debug('HTMLElement::attachShadow');
    this.shadowRoot = new ShadowRoot(options);

    return this.shadowRoot;
  }

  connectedCallback() {
    // console.debug('HTMLElement::connectedCallback');
  }

  // https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md#serialization
  getInnerHTML(options = {}) {
    return options.includeShadowRoots
      ? `
        <template shadowroot="${this.shadowRoot.mode}">
          ${this.shadowRoot.innerHTML}
        </template>
      `
      : this.shadowRoot.innerHTML
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
// EventTarget <- Node <- DocumentFragment
class DocumentFragment extends Node {
  constructor(contents) {
    super();
    // console.debug('DocumentFragment constructor', contents);
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
// EventTarget <- Node <- DocumentFragment <- ShadowRoot
class ShadowRoot extends DocumentFragment {
  constructor(options) {
    super();
    // console.debug('ShadowRoot constructor');
    this.mode = options.mode || 'closed';
  }
};

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement
// EventTarget <- Node <- Element <- HTMLElement <- HTMLTemplateElement
class HTMLTemplateElement extends HTMLElement {
  constructor() {
    super();
    // console.debug('HTMLTemplateElement constructor');

    this.content = new DocumentFragment(this.innerHTML);
  }

  set innerHTML(html) {
    this.content.textContent = html;
  }
}

const customElementsRegistry = {};

globalThis.document = {
  createElement(tagName) {
    switch(tagName) {
      case 'template':
        return new HTMLTemplateElement();
      default:
        return new HTMLElement();
    }
  },
  createDocumentFragment(html) {
    return new DocumentFragment(html)
  }
}

globalThis.HTMLElement = HTMLElement;
globalThis.customElements = {
  define: (tagName, BaseClass) => {
    // console.debug('customElements.define => ', tagName);
    customElementsRegistry[tagName] = BaseClass;
  },
  get: (tagName) => {
    // console.debug('customElements.get => ', tagName);
    return customElementsRegistry[tagName];
  }
}

const HydrateElement = await import('./hydrate-element.js').HydrateElement;
globalThis.HydrateElement = HydrateElement;