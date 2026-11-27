declare const Signal: typeof import('signal-polyfill').Signal;

declare module '*.module.css' {
  const styles: Readonly<Record<string, string>>;
  export default styles;
}

declare module '*?type=text' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const sheet: CSSStyleSheet;

  export default sheet;
}
