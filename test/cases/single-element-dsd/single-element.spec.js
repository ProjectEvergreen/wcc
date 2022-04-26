/*
 * Use Case
 * Run wcc against a single custom element with declarative shadow dom
 *
 * User Result
 * Should generate a single index.html file with the expected HTML output.
 *
 * User Workspace
 * src/
 *   footer.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For: ', function() {
  const LABEL = 'Single Custom Element w/ Declarative Shadow DOM';
  let dom;

  // TODO test with and without fragment flag
  before(async function() {
    const { html } = await renderToString(new URL('./src/footer.js', import.meta.url));
    
    dom = new JSDOM(html);
  });

  describe(LABEL, function() {

    it('should have a <template> with an open shadowroot', function() {
      expect(dom.window.document.querySelectorAll('template[shadowroot="open"]').length).to.equal(1);
      expect(dom.window.document.querySelectorAll('template').length).to.equal(1);
    });

    it('should have a <footer> tag within the <template> shadowroot', function() {
      const template = new JSDOM(dom.window.document.querySelectorAll('template[shadowroot="open"]')[0].innerHTML);

      expect(template.window.document.querySelectorAll('footer').length).to.equal(1);
    });

  });
});