import type { HtmlAttributes, SvgAttributes } from './jsx-attributes.js';

type EventAttributes<Events> = {
  // WCC supports inline assignments/updates, e.g. onclick={this.count += 1}.
  [Name in keyof Events & string as `on${Name}`]?:
    ((event: Events[Name]) => unknown) | number | boolean | void;
};

type WccCustomAttributes = {
  // Allow JSX child values such as text, expressions, and nested elements.
  // unknown keeps this permissive; it is separate from the DOM's children collection.
  children?: unknown;
  // WCC inserts this string as unescaped child markup instead of an HTML attribute.
  // Cannot be combined with JSX children or used on void elements.
  innerHTML?: string;
};

type HtmlIntrinsicElements = {
  [Tag in keyof HtmlAttributes]: HtmlAttributes[Tag] &
    EventAttributes<HTMLElementEventMap> &
    WccCustomAttributes;
};

type SvgIntrinsicElements = {
  [Tag in keyof SvgAttributes]: SvgAttributes[Tag] &
    EventAttributes<SVGElementEventMap> &
    WccCustomAttributes;
};

type IntrinsicElementsMap = {
  // JSX cannot distinguish HTML <a> from <a> inside SVG. Accept either set.
  [Tag in keyof HtmlIntrinsicElements | keyof SvgIntrinsicElements]:
    | (Tag extends keyof HtmlIntrinsicElements ? HtmlIntrinsicElements[Tag] : never)
    | (Tag extends keyof SvgIntrinsicElements ? SvgIntrinsicElements[Tag] : never);
};

declare global {
  namespace JSX {
    interface IntrinsicElements extends IntrinsicElementsMap {}
  }
}
