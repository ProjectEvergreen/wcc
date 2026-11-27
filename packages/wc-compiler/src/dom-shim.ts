import { parse, parseFragment, serialize } from 'parse5';
import type { DefaultTreeAdapterTypes as H, Token } from 'parse5';

/** @internal Shared parse5/shim shape; this is not a complete browser Node. */
export interface SsrNode {
  nodeName: string | undefined;
  tagName?: string;
  value?: string;
  attrs?: Token.Attribute[];
  parentNode?: SsrNode | null;
  childNodes?: SsrNode[];
  content?: SsrParent;
  shadowRoot?: SsrParent;
  textContent?: string;
  removeChild?(node: SsrNode): SsrNode | null;
}

/** A node that can contain children. */
interface SsrParent extends SsrNode {
  childNodes: SsrNode[];
}

/** @internal The partial element implementation used during rendering. */
export type SsrElement = HTMLElement;
/** @internal A component constructor loaded by the renderer. */
export type CustomElementConstructor = new (props?: unknown) => SsrElement;

export function getParse(html: string) {
  return html.indexOf('<html>') >= 0 || html.indexOf('<body>') >= 0 || html.indexOf('<head>') >= 0
    ? parse
    : parseFragment;
}

function isShadowRoot(element: SsrNode): element is ShadowRoot {
  return Object.getPrototypeOf(element).constructor.name === 'ShadowRoot';
}

function deepClone<T>(obj: T, map = new WeakMap<object, unknown>()): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (map.has(obj)) return map.get(obj) as T;
  const result: Record<string, unknown> | unknown[] = Array.isArray(obj) ? [] : {};
  map.set(obj, result);
  for (const key of Object.keys(obj)) {
    (result as Record<string, unknown>)[key] = deepClone(
      (obj as Record<string, unknown>)[key],
      map,
    );
  }
  return result as T;
}

// Creates an empty parse5 element without the parse5 overhead resulting in better performance
function getParse5ElementDefaults(element: Node, tagName?: string) {
  return {
    addEventListener: noop,
    attrs: [],
    parentNode: element.parentNode,
    childNodes: [],
    nodeName: tagName,
    tagName: tagName,
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    ...(tagName === 'template'
      ? { content: { nodeName: '#document-fragment', childNodes: [] } }
      : {}),
  };
}

function noop() {}

// https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet
class CSSStyleSheet {
  insertRule() {}
  deleteRule() {}
  replace() {}
  replaceSync() {}
}

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
class EventTarget {
  declare addEventListener: () => void;
  constructor() {
    this.addEventListener = noop;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Node
// EventTarget <- Node
// TODO should be an interface?
class Node extends EventTarget implements SsrParent {
  declare attrs: Token.Attribute[];
  declare parentNode: SsrNode | null;
  declare childNodes: SsrNode[];
  declare nodeName: string | undefined;
  declare tagName: string;
  declare namespaceURI: string;
  declare value?: string;
  declare content: SsrParent & { cloneNode(deep?: boolean): SsrNode };
  declare shadowRoot?: ShadowRoot;

  constructor() {
    super();
    // Parse5 properties
    this.attrs = [];
    this.parentNode = null;
    this.childNodes = [];
    this.nodeName = '';
  }

  cloneNode(deep?: boolean): this {
    return deep ? deepClone(this) : Object.assign({}, this);
  }

  appendChild(node: SsrNode): SsrNode {
    const childNodes = (this.nodeName === 'template' ? this.content : this).childNodes;

    if (node.parentNode) {
      node.parentNode?.removeChild?.(node);
    }

    if (node.nodeName === 'template') {
      if (isShadowRoot(this) && this.mode) {
        node.attrs = [{ name: 'shadowrootmode', value: this.mode }];
        childNodes.push(node);
        node.parentNode = this;
      } else {
        this.childNodes = [...this.childNodes, ...node.content!.childNodes];
      }
    } else if (node instanceof DocumentFragment) {
      this.childNodes = [...this.childNodes, ...node.childNodes];
    } else {
      childNodes.push(node);
      node.parentNode = this;
    }

    return node;
  }

  removeChild(node: SsrNode): SsrNode | null {
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

  get textContent(): string {
    if (this.nodeName === '#text') {
      return this.value || '';
    }

    return this.childNodes
      .map((child) => (child.nodeName === '#text' ? child.value : child.textContent))
      .join('');
  }

  set textContent(value: string) {
    this.childNodes = [];

    if (value) {
      const textNode = new Node();
      textNode.nodeName = '#text';
      textNode.value = value;
      textNode.parentNode = this;
      this.childNodes.push(textNode);
    }
  }

  // minimal shim to support JSX <> Signals compilation and caching DOM references tracked to effects
  querySelector() {}
  querySelectorAll() {}
}

// https://developer.mozilla.org/en-US/docs/Web/API/Element
// EventTarget <- Node <- Element
class Element extends Node {
  constructor() {
    super();
  }

  attachShadow(options: ShadowRootInit): ShadowRoot {
    this.shadowRoot = new ShadowRoot(options);
    this.shadowRoot.parentNode = this;
    return this.shadowRoot;
  }

  getHTML({ serializableShadowRoots = false }: { serializableShadowRoots?: boolean }): string {
    return this.shadowRoot && serializableShadowRoots && this.shadowRoot.serializable
      ? this.shadowRoot.innerHTML
      : '';
  }

  get innerHTML(): string {
    const childNodes = (this.nodeName === 'template' ? this.content : this).childNodes;
    return childNodes ? serialize({ childNodes } as unknown as H.ParentNode) : '';
  }

  set innerHTML(html: string) {
    (this.nodeName === 'template' ? this.content : this).childNodes =
      getParse(html)(html).childNodes;
  }

  hasAttribute(name: string): boolean {
    return this.attrs.some((attr) => attr.name === name);
  }

  getAttribute(name: string): string | null {
    const attr = this.attrs.find((attr) => attr.name === name);
    return attr ? attr.value : null;
  }

  setAttribute(name: string, value: string): void {
    const attr = this.attrs?.find((attr) => attr.name === name);

    if (attr) {
      attr.value = value;
    } else {
      this.attrs?.push({ name, value });
    }
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Document
// EventTarget <- Node <- Document
class Document extends Node {
  createElement(tagName: string): HTMLElement {
    switch (tagName) {
      case 'template':
        return new HTMLTemplateElement();

      default:
        return new HTMLElement(tagName);
    }
  }

  createDocumentFragment(html?: unknown): DocumentFragment {
    void html; // The original shim accepted this argument but did not consume it.
    return new DocumentFragment();
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
// EventTarget <- Node <- Element <- HTMLElement
class HTMLElement extends Element {
  constructor(tagName?: string) {
    super();
    Object.assign(this, getParse5ElementDefaults(this, tagName));
  }
  connectedCallback() {}
}

// https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
// EventTarget <- Node <- DocumentFragment
class DocumentFragment extends Node {}

// https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
// EventTarget <- Node <- DocumentFragment <- ShadowRoot
class ShadowRoot extends DocumentFragment {
  declare mode: ShadowRootMode;
  declare serializable: boolean;
  declare adoptedStyleSheets: CSSStyleSheet[];

  constructor(options: ShadowRootInit) {
    super();
    this.mode = options.mode ?? 'closed';
    this.serializable = options.serializable ?? false;
    this.adoptedStyleSheets = [];
  }

  get innerHTML(): string {
    return this.childNodes?.[0]?.content?.childNodes
      ? serialize({ childNodes: this.childNodes[0].content!.childNodes } as unknown as H.ParentNode)
      : '';
  }

  set innerHTML(html: string) {
    this.childNodes = getParse(html)(
      `<template shadowrootmode="${this.mode}">${html}</template>`,
    ).childNodes;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement
// EventTarget <- Node <- Element <- HTMLElement <- HTMLTemplateElement
class HTMLTemplateElement extends HTMLElement {
  constructor() {
    super();
    // Gets element defaults for template element instead of parsing a
    // <template></template> with parse5. Results in better performance
    // when creating templates
    Object.assign(this, getParse5ElementDefaults(this, 'template'));
    this.content.cloneNode = this.cloneNode.bind(this);
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry
class CustomElementsRegistry {
  declare customElementsRegistry: Map<string | undefined, CustomElementConstructor>;
  constructor() {
    // TODO this should probably be a set or otherwise follow the spec?
    // https://github.com/ProjectEvergreen/wcc/discussions/145
    this.customElementsRegistry = new Map();
  }

  define(tagName: string, BaseClass: CustomElementConstructor): void {
    // TODO this should probably fail as per the spec...
    // e.g. if(this.customElementsRegistry.get(tagName))
    // https://github.com/ProjectEvergreen/wcc/discussions/145
    this.customElementsRegistry.set(tagName, BaseClass);
  }

  get(tagName: string | undefined): CustomElementConstructor | undefined {
    return this.customElementsRegistry.get(tagName);
  }
}

// mock top level aliases (globalThis === window)
// https://developer.mozilla.org/en-US/docs/Web/API/Window
// make this "idempotent" for now until a better idea comes along - https://github.com/ProjectEvergreen/wcc/discussions/145
// The shim intentionally implements only the DOM features needed for SSR.
// Do not claim these objects implement the complete browser DOM interfaces.
const globals = globalThis as unknown as {
  addEventListener?: typeof noop;
  document?: Document;
  customElements?: CustomElementsRegistry;
  HTMLElement?: typeof HTMLElement;
  DocumentFragment?: typeof DocumentFragment;
  CSSStyleSheet?: typeof CSSStyleSheet;
};
globals.addEventListener = globals.addEventListener ?? noop;
globals.document = globals.document ?? new Document();
globals.customElements = globals.customElements ?? new CustomElementsRegistry();
globals.HTMLElement = globals.HTMLElement ?? HTMLElement;
globals.DocumentFragment = globals.DocumentFragment ?? DocumentFragment;
globals.CSSStyleSheet = globals.CSSStyleSheet ?? CSSStyleSheet;
