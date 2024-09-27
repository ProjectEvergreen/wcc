/*
 * Use Case
 * Run wcc against nested custom elements using just innerHTML to intentionally NOT render Shadow DOM.
 *
 * User Result
 * Should return the expected HTML with no template tags or Shadow Roots.
 *
 * User Workspace
 * src/
 *   components/
 *     navigation.js
 *     header.js
 *   pages/
 *     index.js
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Nested Custom Element using only innerHTML (no Shadow DOM)';
  let dom;

  before(async function() {
    const { html } = await renderToString(new URL('./src/pages/index.js', import.meta.url));

    dom = new JSDOM(html);
  });

  describe(LABEL, function() {
    it('should not have any <template> tags within the document', function() {
      expect(dom.window.document.querySelectorAll('template').length).to.equal(0);
    });

    describe('static page content', function() {
      it('should have the expected static content for the page', function() {
        expect(dom.window.document.querySelector('h1').textContent).to.equal('Home Page');
      });
    });

    describe('custom header element with nested navigation element', function() {
      let headerContentsDom;

      before(function() {
        headerContentsDom = new JSDOM(dom.window.document.querySelectorAll('header')[0].innerHTML);
      });

      it('should have a <header> tag within the document', function() {
        expect(dom.window.document.querySelectorAll('header').length).to.equal(1);
      });

      it('should have expected content within the <header> tag', function() {
        const content = headerContentsDom.window.document.querySelector('a h4').textContent;

        expect(content).to.contain('My Personal Blog');
      });

      describe('nested navigation element', function() {
        let navigationContentsDom;

        before(function() {
          navigationContentsDom = new JSDOM(dom.window.document.querySelectorAll('wcc-navigation')[0].innerHTML);
        });

        it('should have a <nav> tag within the <template> shadowroot', function() {
          expect(navigationContentsDom.window.document.querySelectorAll('nav').length).to.equal(1);
        });

        it('should have three links within the <nav> element', function() {
          const links = navigationContentsDom.window.document.querySelectorAll('nav ul li a');

          expect(links.length).to.equal(3);
        });
      });
    });
  });
});