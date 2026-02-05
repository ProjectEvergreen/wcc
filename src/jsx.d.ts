// to support `style` attributes, we override `CSSStyleDeclaration` with `string`
type IsCSSStyleDeclaration<T> = T extends CSSStyleDeclaration ? string : T;

// creates a utility type to extract the attributes from any given element's DOM interface from `HTMLElementTagNameMap`
type ElementAttributes<E extends HTMLElement> = {
  // Extract all properties from the element, including inherited ones
  [A in keyof E]?: E[A] extends (...args: any) => any ? any : IsCSSStyleDeclaration<E[A]>;
} & {
  class?: string;
  // have to manage this manually, can't seem to get this from TypeScript itself (not sure if just skill issue? :D)
  // https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1790
  // it should be there per https://github.com/mdn/browser-compat-data/pull/21875
  // https://github.com/ProjectEvergreen/wcc/issues/236
  popovertarget?: string;
  popovertargetaction?: 'show' | 'hide' | 'toggle';
};

// map each HTML tag to its attributes
type IntrinsicElementsFromDom = {
  [E in keyof HTMLElementTagNameMap]: ElementAttributes<HTMLElementTagNameMap[E]>;
};

declare namespace JSX {
  interface IntrinsicElements extends IntrinsicElementsFromDom {}
}
