declare module '*.module.css' {
  const styles: Readonly<Record<string, string>>;
  export default styles;
}

declare module '*?type=raw' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const sheet: CSSStyleSheet;

  export default sheet;
}
