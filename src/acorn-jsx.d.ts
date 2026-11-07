// TODO: Remove this workaround after upstream publishes matching ESM declarations.
// Upstream ships index.d.ts, but it uses CommonJS `export = jsx` while index.js exports an ESM default
// https://github.com/ProjectEvergreen/acorn-jsx-esm/blob/main/index.d.ts
declare module '@projectevergreen/acorn-jsx-esm' {
  import type { Parser } from 'acorn';
  export default function jsx(): (parser: typeof Parser) => typeof Parser;
}
