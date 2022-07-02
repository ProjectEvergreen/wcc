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

describe('Run WCC For ', function() {
  const LABEL = 'Single Custom Element using JSX and Declarative Shadow DOM';
  // let dom;
  // let rawHtml;
  let meta;

  before(async function() {
    const { metadata } = await renderToString(new URL('./src/counter.jsx', import.meta.url));

    meta = metadata;
    // rawHtml = html;
    // dom = new JSDOM(html);
  });

  describe(LABEL, function() {

    describe('<Counter> component', function() {
      // let counter;

      // before(async function() {
      //   footer = new JSDOM(dom.window.document.querySelectorAll('wcc-footer template[shadowroot="open"]')[0].innerHTML);
      // });

      it('should do something', () => {
        expect(Object.keys(meta).length).to.equal(1);
        expect(meta['wcc-counter'].source).to.not.be.undefined;
      });
    });

  });
});