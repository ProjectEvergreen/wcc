/*
 * Use Case
 * Run wcc against a JSX component file that also declares a plain helper class with no `extends`
 * (e.g. `class Formatter { ... }`) alongside the custom element.
 *
 * User Result
 * Compilation should succeed (the non-extending helper class must not crash the compiler) and the
 * custom element should still render.
 *
 * User Workspace
 * src/
 *   badge.jsx
 */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function () {
  const LABEL = 'JSX Component File Containing A Plain Class Without Extends';
  let dom;
  let html;

  before(async function () {
    const result = await renderToString(new URL('./src/badge.jsx', import.meta.url));

    html = result.html;
    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    describe('<wcc-badge> component', function () {
      it('should compile without throwing and produce output', function () {
        expect(html).to.not.be.undefined;
        expect(html.length).to.be.greaterThan(0);
      });

      it('should still render the custom element', function () {
        const badge = dom.window.document.querySelector('wcc-badge');

        expect(badge).to.not.be.null;
      });

      it('should render the element contents from the render function', function () {
        const badge = dom.window.document.querySelector('wcc-badge');
        const span = new JSDOM(badge.innerHTML).window.document.querySelector('span.badge');

        expect(span).to.not.be.null;
        expect(span.textContent.trim()).to.be.equal('42');
      });
    });
  });
});
