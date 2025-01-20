/*
 * Use Case
 * Run wcc against a component that passes properties to a child component.
 *
 * User Result
 * Should return the expected HTML output based on the content of the passed property.
 *
 * User Workspace
 * src/
 *   index.js
 *   renderer.js
 *   components/
 *     prop-passer.js
 *     prop-receiver.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Custom Element w/ Element Properties';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/index.js', import.meta.url));
    console.log(html);
    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    it('should have a prop-receiver component with a heading tag with text content equal to "bar"', function () {
      expect(dom.window.document.querySelector('prop-receiver h2').textContent).to.equal('bar');
    });
  });
});
