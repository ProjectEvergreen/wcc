// create a utility type to extract the attributes from any given element's DOM interface.
type ElementAttributes<E extends HTMLElement> = {
  // Extract all properties from the element, including inherited ones.
  [A in keyof E]?: E[A] extends (...args: any) => any ? any : E[A];
} & {
  class?: string;
};

// map each HTML tag to a union of its attributes and the global attributes.
type IntrinsicElementsFromDom = {
  [E in keyof HTMLElementTagNameMap]: ElementAttributes<HTMLElementTagNameMap[E]>;
};

// declare the global JSX namespace with your generated intrinsic elements.
declare namespace JSX {
  interface IntrinsicElements extends IntrinsicElementsFromDom {}
}