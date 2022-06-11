/*
 * Use Case
 * Run wcc against nested custom elements with declarative shadow dom
 *
 * User Result
 * Should return the expected HTML output for all levels of element nesting.
 *
 * User Workspace
 * src/
 *   assets/
 *     navigation.js
 *   components/
 *     footer.js
 *     header.js
 *   pages/
 *     index.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Nested Custom Element w/ Declarative Shadow DOM';
  let dom;
  let pageContentsDom;

  before(async function() {
    const { html } = await renderToString(new URL('./src/pages/index.js', import.meta.url));

    dom = new JSDOM(html);
    pageContentsDom = new JSDOM(dom.window.document.querySelectorAll('wcc-home template[shadowroot="open"]')[0].innerHTML);
  });

  describe(LABEL, function() {
    it('should have one top level <template> with an open shadowroot', function() {
      expect(dom.window.document.querySelectorAll('template[shadowroot="open"]').length).to.equal(1);
      expect(dom.window.document.querySelectorAll('template').length).to.equal(1);
    });

    describe('custom footer element', function() {
      let footerContentsDom;

      before(function() {
        footerContentsDom = new JSDOM(pageContentsDom.window.document.querySelectorAll('wcc-footer template[shadowroot="open"]')[0].innerHTML);
      });

      it('should have a <footer> tag within the <template> shadowroot', function() {
        expect(footerContentsDom.window.document.querySelectorAll('footer').length).to.equal(1);
      });

      it('should have expected content within the <footer> tag', function() {
        const content = footerContentsDom.window.document.querySelector('footer h4 a').textContent;

        expect(content).to.contain('My Blog');
      });
    });

    describe('static page content', function() {
      it('should have the expected static content for the page', function() {
        expect(pageContentsDom.window.document.querySelector('h1').textContent).to.equal('Home Page');
      });
    });

    describe('custom header element with nested navigation element', function() {
      let headerContentsDom;

      before(function() {
        headerContentsDom = new JSDOM(pageContentsDom.window.document.querySelectorAll('wcc-header template[shadowroot="open"]')[0].innerHTML);
      });

      it('should have a <header> tag within the <template> shadowroot', function() {
        expect(headerContentsDom.window.document.querySelectorAll('header').length).to.equal(1);
      });

      it('should have expected content within the <header> tag', function() {
        const content = headerContentsDom.window.document.querySelector('header a h4').textContent;

        expect(content).to.contain('My Personal Blog');
      });

      describe('nested navigation element', function() {
        let navigationContentsDom;

        before(function() {
          navigationContentsDom = new JSDOM(headerContentsDom.window.document.querySelectorAll('wcc-navigation template[shadowroot="open"]')[0].innerHTML);
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