import { expect } from 'chai';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

describe('Published TypeScript declarations', function () {
  it('should support public declarations and JSX augmentation for strict consumers', function () {
    this.timeout(10000);

    // Compile a virtual consumer beside the tests so package self-resolution
    // exercises the same exports and declaration files as an installed package.
    const filename = fileURLToPath(new URL('./consumer.mts', import.meta.url));
    const source = `
      import { renderToString, renderFromHTML } from 'wc-compiler';
      import { getParse } from 'wc-compiler/dom-shim';
      import { getParser, parseJsx, load, resolve } from 'wc-compiler/jsx-loader';
      import { effect } from 'wc-compiler/effect';
      import 'wc-compiler/register';
      import 'wc-compiler/jsx-runtime';
      import type { Metadata, renderToString as RenderToString, renderFromHTML as RenderFromHTML } from 'wc-compiler';

      // @ts-expect-error - SSR implementation types are not public API
      import type { SsrNode } from 'wc-compiler/dom-shim';
      // @ts-expect-error - SSR implementation types are not public API
      import type { SsrParent } from 'wc-compiler/dom-shim';
      // @ts-expect-error - SSR implementation types are not public API
      import type { SsrElement } from 'wc-compiler/dom-shim';
      // @ts-expect-error - SSR implementation types are not public API
      import type { CustomElementConstructor } from 'wc-compiler/dom-shim';
      // @ts-expect-error - implementation result interfaces are not public API
      import type { RenderResult } from 'wc-compiler';
      // @ts-expect-error - implementation result interfaces are not public API
      import type { HtmlRenderResult } from 'wc-compiler';

      const render: RenderToString = renderToString;
      const fromHtml: RenderFromHTML = renderFromHTML;
      const result = await render(new URL('file:///component.js'));
      const metadata: Metadata = result.metadata;
      await fromHtml('<div></div>', []);
      getParse('<div></div>');
      getParser(new URL('file:///component.jsx'));
      const tree = parseJsx(new URL('file:///component.tsx'));
      const statement = tree.body[0];
      if (statement?.type === 'ExpressionStatement' && statement.expression.type === 'JSXElement') {
        const opening: 'JSXOpeningElement' = statement.expression.openingElement.type;
      }
      effect(() => {});

      const button: JSX.IntrinsicElements['button'] = { popover: 'auto', tabindex: -1 };
      const svg: JSX.IntrinsicElements['svg'] = { viewBox: '0 0 10 10' };
      declare global {
        namespace JSX {
          interface IntrinsicElements { 'wcc-example': { count?: number }; }
        }
      }
      const custom: JSX.IntrinsicElements['wcc-example'] = { count: 1 };
    `;
    const options = {
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      module: ts.ModuleKind.NodeNext,
      target: ts.ScriptTarget.ESNext,
      types: ['node'],
      lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, ...args) =>
      name === filename
        ? ts.createSourceFile(name, source, options.target)
        : getSourceFile(name, ...args);

    const program = ts.createProgram([filename], options, host);
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));

    expect(diagnostics).to.deep.equal([]);
  });
});
