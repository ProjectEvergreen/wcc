/*
 * Use Case
 * Run wcc using getHTML in a component with a variety of serializable and serializableShadowRoots values.
 *
 * User Result
 * Should return an element with no content and an element with content.
 *
 * User Workspace
 * src/
 *   index.js
 *   components/
 *     serializable-non-ssr-component.js
 *     serializable-ssr-component.js
 *     unserializable-non-ssr-component.js
 *     unserializable-ssr-component.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Custom Elements w/ Serializable Shadow Roots';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/index.js', import.meta.url));
    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    it('should have a serializable-ssr-component with an h2 tag with textContent equal to "Serializable Component with serializableShadowRoots"', function () {
      expect(
        dom.window.document.querySelector('serializable-ssr-component template[shadowrootmode="open"]').innerHTML.trim()
      ).to.equal('<h2>Serializable Component with serializableShadowRoots</h2>');
    });

    it('should have a serializable-non-ssr-component with no innerHTML', function () {
      expect(
        dom.window.document
          .querySelector('serializable-non-ssr-component template[shadowrootmode="open"]')
          .innerHTML.trim()
      ).to.equal('');
    });

    it('should have an unserializable-ssr-component with no innerHTML', function () {
      expect(
        dom.window.document
          .querySelector('unserializable-ssr-component template[shadowrootmode="open"]')
          .innerHTML.trim()
      ).to.equal('');
    });

    it('should have an unserializable-non-ssr-component with no innerHTML', function () {
      expect(
        dom.window.document
          .querySelector('unserializable-non-ssr-component template[shadowrootmode="open"]')
          .innerHTML.trim()
      ).to.equal('');
    });
  });
});
