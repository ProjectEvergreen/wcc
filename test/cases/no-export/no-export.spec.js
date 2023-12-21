/*
 * Use Case
 * Run wcc against a single custom element using with no internal definitions
 *
 * User Result
 * Should run without any errors from the DOM shim.
 *
 * User Workspace
 * src/
 *   empty.js
 */

import chai from 'chai';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Single Custom Element with no default export';
  let rawHtml;
  let meta;

  before(async function() {
    const { html, metadata } = await renderToString(new URL('./src/no-export.js', import.meta.url));

    rawHtml = html;
    meta = metadata;
  });

  describe(LABEL, function() {
    it('should not throw an error', function() {
      expect(rawHtml).to.equal(undefined);
    });

    it('should not have any definition', function() {
      expect(meta.length).to.equal(0);
    });
  });

});