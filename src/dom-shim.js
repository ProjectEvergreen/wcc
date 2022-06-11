// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
class EventTarget { }

// https://developer.mozilla.org/en-US/docs/Web/API/Node
// EventTarget <- Node
// TODO should be an interface?
class Node extends EventTarget {
  constructor() {
    super();
    // console.debug('Node constructor');
  }

  // eslint-disable-next-line
  cloneNode(deep) {
    return this;
  }

  appendChild(node) {
    this.innerHTML = this.innerHTML ? this.innerHTML += node.innerHTML : node.innerHTML;
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
    this.attributes = {};
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  hasAttribute(name) {
    return !!this.attributes[name];
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
  // eslint-disable-next-line
  getInnerHTML(options = {}) {
    return this.shadowRoot.innerHTML;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
// EventTarget <- Node <- DocumentFragment
class DocumentFragment extends Node {
  // eslint-disable-next-line
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
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement
// EventTarget <- Node <- Element <- HTMLElement <- HTMLTemplateElement
class HTMLTemplateElement extends HTMLElement {
  constructor() {
    super();
    // console.debug('HTMLTemplateElement constructor');

    this.content = new DocumentFragment();
  }

  // TODO open vs closed shadow root
  set innerHTML(html) {
    this.content.innerHTML = `
      <template shadowroot="open">
        ${html}
      </template>
    `;
  }

  get innerHTML() {
    return this.content && this.content.innerHTML ? this.content.innerHTML : undefined;
  }
}

const customElementsRegistry = {};

globalThis.document = {
  createElement(tagName) {
    switch (tagName) {

      case 'template':
        return new HTMLTemplateElement();

      default:
        return new HTMLElement();

    }
  },
  createDocumentFragment(html) {
    return new DocumentFragment(html);
  }
};

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
};