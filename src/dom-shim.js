function noop() { }

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
class EventTarget {
  constructor() {
    this.addEventListener = noop;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Node
// EventTarget <- Node
// TODO should be an interface?
class Node extends EventTarget {
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
    this.shadowRoot = null;
    this.innerHTML = '';
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

// https://developer.mozilla.org/en-US/docs/Web/API/Document
// EventTarget <- Node <- Document
class Document extends Node {

  createElement(tagName) {
    switch (tagName) {

      case 'template':
        return new HTMLTemplateElement();

      default:
        return new HTMLElement();

    }
  }

  createDocumentFragment(html) {
    return new DocumentFragment(html);
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
// EventTarget <- Node <- Element <- HTMLElement
class HTMLElement extends Element {
  attachShadow(options) {
    this.shadowRoot = new ShadowRoot(options);

    return this.shadowRoot;
  }

  connectedCallback() { }

  // https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md#serialization
  // eslint-disable-next-line
  getInnerHTML(options = {}) {
    return this.shadowRoot.innerHTML;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
// EventTarget <- Node <- DocumentFragment
class DocumentFragment extends Node { }

// https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
// EventTarget <- Node <- DocumentFragment <- ShadowRoot
class ShadowRoot extends DocumentFragment {
  constructor(options) {
    super();
    this.mode = options.mode || 'closed';
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement
// EventTarget <- Node <- Element <- HTMLElement <- HTMLTemplateElement
class HTMLTemplateElement extends HTMLElement {
  constructor() {
    super();
    this.content = new DocumentFragment();
  }

  // TODO open vs closed shadow root
  set innerHTML(html) {
    if (this.content) {
      this.content.innerHTML = `
        <template shadowroot="open">
          ${html}
        </template>
      `;
    }
  }

  get innerHTML() {
    return this.content && this.content.innerHTML ? this.content.innerHTML : undefined;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry
class CustomElementsRegistry {
  constructor() {
    this.customElementsRegistry = {};
  }

  define(tagName, BaseClass) {
    this.customElementsRegistry[tagName] = BaseClass;
  }

  get(tagName) {
    return this.customElementsRegistry[tagName];
  }
}

// mock top level aliases (globalThis === window)
// https://developer.mozilla.org/en-US/docs/Web/API/Window
globalThis.addEventListener = noop;
globalThis.document = new Document();
globalThis.customElements = new CustomElementsRegistry();
globalThis.HTMLElement = HTMLElement;