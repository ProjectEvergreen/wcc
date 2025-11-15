/*
 * Use Case
 * Run wcc against a component which sets innerHTML to a full HTML document.
 *
 * User Result
 * Should return the expected HTML output with a component containing a full HTML document.
 *
 * User Workspace
 * src/
 *   index.js
 */

import chai from 'chai';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Custom Element w/ Document Fragments';
  let renderedContent;

  before(async function () {
    const { html } = await renderToString(new URL('./src/index.js', import.meta.url));
    renderedContent = html.replace(/\s+/g, '');
  });

  describe(LABEL, function () {
    it('should have a heading tag with text renderedContent equal to "document.createDocumentFragment()"', function () {
      expect(renderedContent).to.equal(
        '<full-document-component><!DOCTYPE html><html><head><title>App Layout</title></head><body><h1>App Layout</h1></body></html></full-document-component>'.replace(
          /\s+/g,
          '',
        ),
      );
    });
  });
});
