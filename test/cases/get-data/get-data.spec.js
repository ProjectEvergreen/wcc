/*
 * Use Case
 * Run wcc against a custom element with getData function and declarative shadow dom
 *
 * User Result
 * Should return the expected HTML output based on the attribute values.
 *
 * User Workspace
 * src/
 *   components/
 *     counter.js
 *   index.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Custom Element w/ getData and Shadow DOM';
  let dom;

  before(async function() {
    const { html } = await renderToString(new URL('./src/index.js', import.meta.url));

    dom = new JSDOM(html);
  });

  describe(LABEL, function() {
    it('should have one top level <wcc-counter> custom element with a <template> with an open shadowroot', function() {
      expect(dom.window.document.querySelectorAll('wcc-counter template[shadowroot="open"]').length).to.equal(1);
      expect(dom.window.document.querySelectorAll('wcc-counter template').length).to.equal(1);
    });

    describe('static page content', function() {
      it('should have the expected static content for the page', function() {
        expect(dom.window.document.querySelector('h1').textContent).to.equal('Counter');
      });
    });

    describe('custom <wcc-counter> element', function() {
      let counterContentsDom;
      let count;

      before(function() {
        counterContentsDom = new JSDOM(dom.window.document.querySelectorAll('wcc-counter template[shadowroot="open"]')[0].innerHTML);
        count = JSON.parse(counterContentsDom.window.document.querySelector('script[type="application/json"]').textContent).count;
      });

      it('should have two <button> tags within the <wcc-counter> shadowroot', function() {
        expect(counterContentsDom.window.document.querySelectorAll('button').length).to.equal(2);
      });

      it('should have a <span> with the value of the attribute as its text content', function() {
        const innerCount = counterContentsDom.window.document.querySelector('span#count').textContent;

        expect(count).to.equal(parseInt(innerCount, 10));
      });
    });
  });
});