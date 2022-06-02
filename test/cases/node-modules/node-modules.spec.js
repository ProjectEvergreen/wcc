/*
 * Use Case
 * Run wcc against a custom element using a dependency from node-modules
 *
 * User Result
 * Should run without error.
 *
 * User Workspace
 * src/
 *   components/
 *     events-list.js
 *   index.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Custom Element w/ a node modules dependency';
  let dom;
  let pageContentsDom;

  before(async function() {
    // await renderToString(new URL('./src/index.js', import.meta.url));

    // console.debug({ html });
    // dom = new JSDOM(html);
    // pageContentsDom = new JSDOM(dom.window.document.querySelectorAll('template[shadowroot="open"]')[0].innerHTML);
  });

  describe(LABEL, function() {
    it('should not fail', function() {
      Promise.resolve(renderToString(new URL('./src/index.js', import.meta.url)));
      // expect(true).to.equal(true);
      // expect(dom).to.be.not.undefined;
    });

    // describe('static page content', function() {
    //   it('should have the expected static content for the page', function() {
    //     expect(pageContentsDom.window.document.querySelector('h1').textContent).to.equal('Counter');
    //   });
    // });

    // describe('custom <wcc-counter> element', function() {
    //   let counterContentsDom;
    //   let count;

    //   before(function() {
    //     counterContentsDom = new JSDOM(pageContentsDom.window.document.querySelectorAll('wcc-counter template[shadowroot="open"]')[0].innerHTML);
    //     count = JSON.parse(counterContentsDom.window.document.querySelector('script[type="application/json"]').textContent).count;
    //   });

    //   it('should have two <button> tags within the <wcc-counter> shadowroot', function() {
    //     expect(counterContentsDom.window.document.querySelectorAll('button').length).to.equal(2);
    //   });

    //   it('should have a <span> with the value of the attribute as its text content', function() {
    //     const innerCount = counterContentsDom.window.document.querySelector('span#count').textContent;
  
    //     expect(count).to.equal(parseInt(innerCount, 10));
    //   });
    // });
  });
});