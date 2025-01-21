/*
 * Use Case
 * Run wcc against a component which imports a module twice.
 *
 * User Result
 * Should return the expected HTML output without errors.
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
  const LABEL = 'Custom Element w/ Duplicate Imported Modules';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/index.js', import.meta.url));
    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    it('should have two heading tags', function () {
      expect(dom.window.document.querySelectorAll('h2').length).to.equal(2);
    });
  });
});
