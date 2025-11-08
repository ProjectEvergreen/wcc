/*
 * Use Case
 * Run wcc against a component which sets an attribute of a child heading.
 *
 * User Result
 * Should return a component with a child h2 with the expected attribute and attribute value.
 *
 * User Workspace
 * src/
 *   index.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Custom Element using setAttribute';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/index.js', import.meta.url));
    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    it('should have a heading tag with the "foo" attribute equal to "bar"', function () {
      expect(
        dom.window.document.querySelector('set-attribute-element h2').getAttribute('foo'),
      ).to.equal('bar');
    });
  });
});
