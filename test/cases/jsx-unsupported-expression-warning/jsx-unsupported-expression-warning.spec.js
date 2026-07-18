/*
 * Use Case
 * Run wcc against a JSX component that uses expression node types the renderer does not support
 * (a binary expression `{count + 1}` and a `{items.map(...)}` list). These expressions are
 * dropped from the SSR output; without a diagnostic the developer has no idea why content is
 * missing. This case asserts that a `console.warn` naming the unsupported expression is emitted,
 * while the previous (empty) render behavior is unchanged.
 *
 * User Result
 * Should still render the surrounding markup with the unsupported expressions empty, AND emit a
 * warning naming each unsupported expression so the drop is not silent.
 *
 * User Workspace
 * src/
 *   card.jsx
 */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function () {
  const LABEL = 'Unsupported JSX Expression Warning';
  let dom;
  let warnings;
  let originalWarn;

  before(async function () {
    originalWarn = console.warn;
    warnings = [];
    console.warn = (...args) => {
      warnings.push(args.map(String).join(' '));
    };

    try {
      const { html } = await renderToString(new URL('./src/card.jsx', import.meta.url));

      dom = new JSDOM(html);
    } finally {
      console.warn = originalWarn;
    }
  });

  describe(LABEL, function () {
    describe('Diagnostic for unsupported expression node types', function () {
      it('should warn about the unsupported binary expression naming its source', function () {
        const match = warnings.find(
          (warning) => warning.includes('count + 1') && /unsupported JSX expression/i.test(warning),
        );

        expect(match).to.not.be.undefined;
      });

      // the `.map` body contains JSX, which astring cannot serialize, so the warning names the
      // node type (CallExpression) rather than the source text — still a diagnostic, not silence
      it('should warn about the unsupported `.map` list expression', function () {
        const match = warnings.find(
          (warning) =>
            warning.includes('CallExpression') && /unsupported JSX expression/i.test(warning),
        );

        expect(match).to.not.be.undefined;
      });

      it('should emit at least one unsupported-expression warning', function () {
        const unsupported = warnings.filter((warning) =>
          /unsupported JSX expression/i.test(warning),
        );

        expect(unsupported.length).to.be.greaterThan(0);
      });
    });

    describe('Rendered output (behavior unchanged — expressions still empty)', function () {
      it('should render the paragraph with the binary expression empty', function () {
        const paragraph = dom.window.document.querySelector('p#plus');

        expect(paragraph.textContent.trim()).to.be.equal('Plus one:');
      });

      it('should render an empty list for the `.map` expression', function () {
        const list = dom.window.document.querySelector('ul#list');

        expect(list.querySelectorAll('li').length).to.be.equal(0);
      });
    });
  });
});
