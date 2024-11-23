/* eslint-disable no-warning-comments */

import { parseFragment, serialize } from 'parse5';

// TODO Should go into utils file?
function isShadowRoot(element) {
  return Object.getPrototypeOf(element).constructor.name === 'ShadowRoot';
}

// Deep clone for cloneNode(deep) - TODO should this go into a utils file?
// structuredClone doesn't work with functions. TODO This works with
// all current tests but would it be worth considering a lightweight
// library here to better cover edge cases?
function deepClone(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj; // Return primitives or functions as-is
  }

  if (typeof obj === 'function') {
    const clonedFn = obj.bind({});
    Object.assign(clonedFn, obj);
    return clonedFn;
  }

  if (map.has(obj)) {
    return map.get(obj);
  }

  const result = Array.isArray(obj) ? [] : {};
  map.set(obj, result);

  for (const key of Object.keys(obj)) {
    result[key] = deepClone(obj[key], map);
  }

  return result;
}

// Creates an empty parse5 element without the parse5 overhead. Results in 2-10x better performance.
// TODO Should this go into a utils files?
function getParse5ElementDefaults(element, tagName) {
  return {
    addEventListener: noop,
    attrs: [],
    parentNode: element.parentNode,
    childNodes: [],
    nodeName: tagName,
    tagName: tagName,
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    // eslint-disable-next-line no-extra-parens
    ...(tagName === 'template' ? { content: { nodeName: '#document-fragment', childNodes: [] } } : {})
  };
}

function noop() { }

// https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet
class CSSStyleSheet {
  insertRule() { }
  deleteRule() { }
  replace() { }
  replaceSync() { }
}

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
  constructor() {
    super();
    // Parse5 properties
    this.attrs = [];
    this.parentNode = null;
    this.childNodes = [];
  }

  cloneNode(deep) {
    return deep ? deepClone(this) : Object.assign({}, this);
  }

  appendChild(node) {
    const childNodes = (this.nodeName === 'template' ? this.content : this).childNodes;

    if (node.parentNode) {
      node.parentNode?.removeChild?.(node); // Remove from current parent
    }

    if (node.nodeName === 'template') {
      if (isShadowRoot(this) && this.mode) {
        node.attrs = [{ name: 'shadowrootmode', value: this.mode }];
        childNodes.push(node);
        node.parentNode = this;
      } else {
        this.childNodes = [...this.childNodes, ...node.content.childNodes];
      }
    } else {
      childNodes.push(node);
      node.parentNode = this;
    }

    return node;
  }

  removeChild(node) {
    const childNodes = (this.nodeName === 'template' ? this.content : this).childNodes;
    if (!childNodes || !childNodes.length) {
      return null;
    }

    const index = childNodes.indexOf(node);
    if (index === -1) {
      return null;
    }

    childNodes.splice(index, 1);
    node.parentNode = null;

    return node;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Element
// EventTarget <- Node <- Element
class Element extends Node {
  constructor() {
    super();
  }

  attachShadow(options) {
    this.shadowRoot = new ShadowRoot(options);
    this.shadowRoot.parentNode = this;
    return this.shadowRoot;
  }

  set innerHTML(html) {
    (this.nodeName === 'template' ? this.content : this).childNodes = parseFragment(html).childNodes; // Replace content's child nodes
  }

  // Serialize the content of the DocumentFragment when getting innerHTML
  get innerHTML() {
    const childNodes = (this.nodeName === 'template' ? this.content : this).childNodes;
    return childNodes ? serialize({ childNodes }) : '';
  }

  setAttribute(name, value) {
    // Modified attribute handling to work with parse5
    const attr = this.attrs?.find((attr) => attr.name === name);

    if (attr) {
      attr.value = value;
    } else {
      this.attrs?.push({ name, value });
    }
  }

  getAttribute(name) {
    // Modified attribute handling to work with parse5
    const attr = this.attrs.find((attr) => attr.name === name);
    return attr ? attr.value : null;
  }

  hasAttribute(name) {
    // Modified attribute handling to work with parse5
    return this.attrs.some((attr) => attr.name === name);
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
        return new HTMLElement(tagName);

    }
  }

  createDocumentFragment(html) {
    return new DocumentFragment(html);
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
// EventTarget <- Node <- Element <- HTMLElement
class HTMLElement extends Element {
  constructor(tagName) {
    super();
    Object.assign(this, getParse5ElementDefaults(this, tagName));
  }
  connectedCallback() { }
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
    this.adoptedStyleSheets = [];
  }

  get innerHTML() {
    return this.childNodes ? serialize({ childNodes: this.childNodes }) : '';
  }

  set innerHTML(html) {
    // Replaces auto wrapping functionality that was previously done
    // in HTMLTemplateElement. This allows parse5 to add declarative
    // shadow roots when necessary. To pass tests that wrap innerHTML
    // in a template, we only wrap when if a template isn't found at the
    // start of the html string (this can be removed if those tests are
    // changed)
    html = html.trim().toLowerCase().startsWith('<template')
      ? html
      : `<template shadowrootmode="${this.mode}">${html}</template>`;
    this.childNodes = parseFragment(html).childNodes;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement
// EventTarget <- Node <- Element <- HTMLElement <- HTMLTemplateElement
class HTMLTemplateElement extends HTMLElement {
  constructor() {
    super();
    // Gets element defaults for template element instead of parsing a
    // <template></template> with parse5. Results in 2-5x better performance
    // when creating templates
    Object.assign(this, getParse5ElementDefaults(this, 'template'));
    this.content.cloneNode = this.cloneNode.bind(this);
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry
class CustomElementsRegistry {
  constructor() {
    // TODO this should probably be a set or otherwise follow the spec?
    // https://github.com/ProjectEvergreen/wcc/discussions/145
    this.customElementsRegistry = new Map();
  }

  define(tagName, BaseClass) {
    // TODO Should we throw an error here when a tagName is already defined?
    // Would require altering tests
    // if (this.customElementsRegistry.has(tagName)) {
    //   throw new Error(
    //     `Custom element with tag name ${tagName} is already defined.`
    //   );
    // }

    // TODO this should probably fail as per the spec...
    // e.g. if(this.customElementsRegistry.get(tagName))
    // https://github.com/ProjectEvergreen/wcc/discussions/145
    this.customElementsRegistry.set(tagName, BaseClass);
  }

  get(tagName) {
    return this.customElementsRegistry.get(tagName);
  }
}

// mock top level aliases (globalThis === window)
// https://developer.mozilla.org/en-US/docs/Web/API/Window
// make this "idempotent" for now until a better idea comes along - https://github.com/ProjectEvergreen/wcc/discussions/145
globalThis.addEventListener = globalThis.addEventListener ?? noop;
globalThis.document = globalThis.document ?? new Document();
globalThis.customElements = globalThis.customElements ?? new CustomElementsRegistry();
globalThis.HTMLElement = globalThis.HTMLElement ?? HTMLElement;
globalThis.CSSStyleSheet = globalThis.CSSStyleSheet ?? CSSStyleSheet;