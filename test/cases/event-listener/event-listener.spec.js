/*
 * Use Case
 * Run wcc against a single custom element using addEventListener
 *
 * User Result
 * Should run without any errors from the DOM shim.
 *
 * User Workspace
 * src/
 *   my-component.js
 */

import chai from 'chai';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Single Custom Element using addEventListener';
  let rawHtml;

  before(async function () {
    const { html } = await renderToString(new URL('./src/my-component.js', import.meta.url));

    rawHtml = html;
  });

  describe(LABEL, function () {
    it('should do something', function () {
      expect(rawHtml).to.contain('<h1>It worked!</h1>');
    });
  });
});
