/*
 * Use Case
 * Run wcc against bundled custom elements with no wrapping enabled.
 *
 * User Result
 * Should return the expected HTML with no top level wrapping tag.
 *
 * User Workspace
 * src/
 *   pages/
 *     no-wrap.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Bundled Components w/ No Wrapping Entry Tag';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/no-wrap.js', import.meta.url), false);

    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    describe('no top level wrapping by <wcc-navigation>', function () {
      it('should have a <footer> tag within the <template> shadowroot', function () {
        expect(dom.window.document.querySelectorAll('wcc-navigation').length).to.equal(0);
      });
    });
  });
});
