/*
 * Use Case
 * Run wcc against a custom element using a JSX render function that opts out of
 * inferred observability with `export const inferredObservability = false`.
 *
 * User Result
 * Setting the flag to `false` should behave exactly like omitting the export:
 * no observability wiring (observedAttributes / attributeChangedCallback /
 * effect injection) should be generated in the compiled output.
 *
 * User Workspace
 * src/
 *   counter.jsx
 */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function () {
  const LABEL = 'Custom Element using JSX with Inferred Observability disabled (= false)';
  const effectImport = `import{effect}from'wc-compiler/effect';`;

  describe(LABEL, function () {
    let source;
    let dom;

    before(async function () {
      const { html, metadata } = await renderToString(
        new URL('./src/counter.jsx', import.meta.url),
      );

      source = metadata['wcc-counter-observability-false'].source
        .replace(/ /g, '')
        .replace(/\n/g, '');
      dom = new JSDOM(html);
    });

    it('should NOT generate a get observedAttributes method', () => {
      expect(source).to.not.contain('observedAttributes');
    });

    it('should NOT generate an attributeChangedCallback method', () => {
      expect(source).to.not.contain('attributeChangedCallback');
    });

    it('should NOT generate a static parseAttribute method', () => {
      expect(source).to.not.contain('parseAttribute');
    });

    it('should NOT inject effect wiring (no effect() calls or $eff members)', () => {
      expect(source).to.not.contain('$eff');
    });

    it("should NOT generate an import for WCC's effect function", () => {
      expect(source).to.not.contain(effectImport);
    });

    // `= false` must still render as normal SSR, identical to omitting the export
    it('should still render the component content in the SSR output', () => {
      const shadowDom = new JSDOM(
        dom.window.document.querySelector(
          'wcc-counter-observability-false template[shadowrootmode="open"]',
        ).innerHTML,
      ).window.document;
      const span = shadowDom.querySelector('span#label');

      expect(span.textContent.trim()).to.equal('The count is static');
    });
  });
});
