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
  let rawHtml;

  before(async function() {
    const { html } = await renderToString(new URL('./src/footer.js', import.meta.url));

    rawHtml = html;
    dom = new JSDOM(html);
  });

  describe(LABEL, function() {

    it('should NOT have a <head> tag in the content of the page', function() {
      expect(rawHtml.indexOf('<head>') >= 0).to.equal(false);
    });

    it('should NOT have a <title> tag in the content of the page', function() {
      expect(rawHtml.indexOf('<title>') >= 0).to.equal(false);
    });

    it('should NOT have a <body> tag in the content of the page', function() {
      expect(rawHtml.indexOf('<body>') >= 0).to.equal(false);
    });

    it('should have one top level <wcc-footer> element with a <template> with an open shadowroot', function() {
      expect(dom.window.document.querySelectorAll('wcc-footer template[shadowroot="open"]').length).to.equal(1);
      expect(dom.window.document.querySelectorAll('template').length).to.equal(1);
    });

    describe('<footer> component and content', function() {
      let footer;

      before(async function() {
        footer = new JSDOM(dom.window.document.querySelectorAll('wcc-footer template[shadowroot="open"]')[0].innerHTML);
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