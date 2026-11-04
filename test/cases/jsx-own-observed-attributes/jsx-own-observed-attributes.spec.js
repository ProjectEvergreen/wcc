/*
 * Use Case
 * Run wcc against a custom element using a JSX render function with inferredObservability enabled
 * that ALSO defines its own `static get observedAttributes()` and `attributeChangedCallback`.
 *
 * User Result
 * Should return JavaScript output that keeps the component's own `observedAttributes` /
 * `attributeChangedCallback` and does NOT inject a duplicate second copy of either.
 *
 * User Workspace
 * src/
 *   own-observed.jsx
 */
import { expect } from 'chai';
import { renderToString } from '../../../src/wcc.js';

function countOccurrences(source, needle) {
  return source.split(needle).length - 1;
}

describe('Run WCC For ', function () {
  const LABEL = 'Custom Element w/ JSX, Inferred Observability, and its own observedAttributes';

  describe(LABEL, function () {
    let source;

    before(async function () {
      const { metadata } = await renderToString(new URL('./src/own-observed.jsx', import.meta.url));

      source = metadata['wcc-own-observed'].source;
    });

    it('should not inject a duplicate observedAttributes when the component defines its own', () => {
      expect(countOccurrences(source, 'observedAttributes')).to.equal(1);
    });

    it('should not inject a duplicate attributeChangedCallback when the component defines its own', () => {
      expect(countOccurrences(source, 'attributeChangedCallback')).to.equal(1);
    });

    it("should preserve the component's own observedAttributes list", () => {
      const normalized = source.replace(/\s/g, '');

      expect(normalized).to.contain("return['label']");
    });
  });
});
