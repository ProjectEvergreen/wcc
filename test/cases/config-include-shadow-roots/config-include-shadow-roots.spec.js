/*
 * Use Case
 * Run wcc against nested custom elements with nested declarative shadow dom and ensure no shadow is included
 *
 * User Result
 * Should return the expected HTML output for all levels of element nesting.
 *
 * User Workspace
 * src/
 *   components/
 *     navigation.js
 *     header.js
 *   pages/
 *     index.js
 * 
 * Config
 * {
 *   includeShadowRoots: false
 * }
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Nested Custom Element w/ no rendered Shadow Roots';
  let dom;

  before(async function() {
    const { html } = await renderToString(new URL('./src/pages/index.js', import.meta.url), {
      includeShadowRoots: false
    });

    dom = new JSDOM(html);
  });

  describe(LABEL, function() {
    it('should not have one top level <template> with an open shadowroot', function() {
      expect(dom.window.document.querySelectorAll('template[shadowroot="open"]').length).to.equal(0);
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

      it('should have a <header> tag within the <template> shadowroot', function() {
        expect(dom.window.document.querySelectorAll('header').length).to.equal(1);
      });

      it('should have expected content within the <header> tag', function() {
        const content = headerContentsDom.window.document.querySelector('a h4').textContent;
  
        expect(content).to.contain('My Personal Blog');
      });

      describe('nested navigation element', function() {
        let navigationContentsDom;
  
        before(function() {
          navigationContentsDom = new JSDOM(headerContentsDom.window.document.querySelectorAll('wcc-navigation')[0].innerHTML);
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