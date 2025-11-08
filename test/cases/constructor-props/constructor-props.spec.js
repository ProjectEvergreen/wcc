/*
 * Use Case
 * Run wcc against a custom element passing in constructor props.
 *
 * User Result
 * Should return the expected HTML output based on the fetched content from constructor props.
 *
 * User Workspace
 * src/
 *   index.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Custom Element w/ constructor props';
  const postId = 1;
  let dom;

  before(async function () {
    const { html } = await renderToString(
      new URL('./src/index.js', import.meta.url),
      false,
      postId,
    );

    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    it('should have a heading tag with the postId', function () {
      expect(dom.window.document.querySelectorAll('h1')[0].textContent).to.equal(
        `Fetched Post ID: ${postId}`,
      );
    });

    it('should have a second heading tag with the title', function () {
      expect(dom.window.document.querySelectorAll('h2')[0].textContent).to.equal(
        'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      );
    });

    it('should have a heading tag with the body', function () {
      expect(
        dom.window.document.querySelectorAll('p')[0].textContent.startsWith('quia et suscipit'),
      ).to.equal(true);
    });
  });
});
