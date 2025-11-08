/*
 * Use Case
 * Run wcc against a custom element using import attributes.
 *
 * User Result
 * Should return the expected HTML and no error parsing an import attribute.
 *
 * User Workspace
 * src/
 *   components/
 *     header/
 *       data.json
 *       header.js
 *   pages/
 *     index.js
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Import Attributes usage';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/pages/index.js', import.meta.url));

    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    it('should have the expected static content for the page', function () {
      expect(dom.window.document.querySelector('h1').textContent).to.equal('Home Page');
    });

    it('should have a <header> tag within the document', function () {
      expect(dom.window.document.querySelectorAll('header').length).to.equal(1);
    });

    it('should have two links within the <nav> element sourced from a JSON file', function () {
      const links = dom.window.document.querySelectorAll('header nav ul li');

      expect(links.length).to.equal(2);
    });
  });
});
