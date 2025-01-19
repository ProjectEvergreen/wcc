/*
 * Use Case
 * Run wcc against a component which creates two document fragments and appends them with appendChild.
 *
 * User Result
 * Should return the expected HTML output based on the content of the appended fragments.
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
  const LABEL = 'Custom Element w/ Document Fragments';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/index.js', import.meta.url));
    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    it('should have a heading tag with text content equal to "document.createDocumentFragment()"', function () {
      expect(dom.window.document.querySelectorAll('h2')[0].textContent).to.equal('document.createDocumentFragment()');
    });
  });

  describe(LABEL, function () {
    it('should have a heading tag with text content equal to new "DocumentFragment()"', function () {
      expect(dom.window.document.querySelectorAll('h2')[1].textContent).to.equal('new DocumentFragment()');
    });
  });
});
