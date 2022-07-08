/*
 * Use Case
 * Run wcc against a single custom element with declarative shadow dom
 *
 * User Result
 * Should return the expected HTML output.
 *
 * User Workspace
 * src/
 *   counter.js
 */

import chai from 'chai';
// import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe.only('Run WCC For ', function() {
  const LABEL = 'Single Custom Element using JSX and Declarative Shadow DOM';
  // let dom;
  let rawHtml;
  let meta;

  before(async function() {
    const { html, metadata } = await renderToString(new URL('./src/counter.jsx', import.meta.url));

    meta = metadata;
    rawHtml = html;
    // dom = new JSDOM(html);
  });

  describe(LABEL, function() {

    describe('<Counter> component', function() {
      // let counter;

      // before(async function() {
      //   footer = new JSDOM(dom.window.document.querySelectorAll('wcc-footer template[shadowroot="open"]')[0].innerHTML);
      // });

      it('should return the expected HTML from rendering the component', () => {
        console.debug({ rawHtml });
      });

      it('should return a JSX definition in metadata', () => {
        expect(Object.keys(meta).length).to.equal(1);
        expect(meta['wcc-counter-jsx'].source).to.not.be.undefined;
      });
    });

  });
});