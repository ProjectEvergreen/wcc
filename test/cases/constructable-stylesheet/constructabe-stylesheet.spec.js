/*
 * Use Case
 * Run wcc against a custom element using constructible stylesheets.
 *
 * User Result
 * Should return the expected HTML and no error instatiating a CSSStyleSheet..
 *
 * User Workspace
 * src/
 *   components/
 *     header/
 *       header.js
 *   pages/
 *     index.js
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Constructible Stylesheets usage';
  let dom;

  before(async function() {
    const { html } = await renderToString(new URL('./src/pages/index.js', import.meta.url));

    dom = new JSDOM(html);
  });

  describe(LABEL, function() {
    it('should have one top level <wcc-header> element with a <template> with an open shadowroot', function() {
      expect(dom.window.document.querySelectorAll('wcc-header template[shadowrootmode="open"]').length).to.equal(1);
      expect(dom.window.document.querySelectorAll('template').length).to.equal(1);
    });
  });
});