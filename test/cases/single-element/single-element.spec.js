/*
 * Use Case
 * Run wcc against a single custom element with declarative shadow dom
 *
 * User Result
 * Should return the expected HTML output.
 *
 * User Workspace
 * src/
 *   footer.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Single Custom Element w/ Declarative Shadow DOM';
  let dom;

  before(async function() {
    const { html } = await renderToString(new URL('./src/footer.js', import.meta.url));
    
    dom = new JSDOM(html);
  });

  describe(LABEL, function() {
      
    it('should have one top level <template> with an open shadowroot', function() {
      expect(dom.window.document.querySelectorAll('template[shadowroot="open"]').length).to.equal(1);
      expect(dom.window.document.querySelectorAll('template').length).to.equal(1);
    });

    describe('<footer> component and content', function() {
      let footer;

      before(async function() {
        footer = new JSDOM(dom.window.document.querySelectorAll('template[shadowroot="open"]')[0].innerHTML);
      });

      it('should have one <footer> tag within the <template> shadowroot', function() {
        expect(footer.window.document.querySelectorAll('footer').length).to.equal(1);
      });
  
      it('should have the expected content for the <footer> tag', function() {
        expect(footer.window.document.querySelectorAll('h4 a').textContent).to.contain(/My Blog/);
      });
    });

  });
});