/*
 * Use Case
 * Run wcc against two components, one with an open shadow root and one with a closed shadow root.
 *
 * User Result
 * Should return the expected attribute value for shadowrootmode on the template tag based on the shadow root mode of each component.
 *
 * User Workspace
 * src/
 *   index.js
 *   components/
 *     closed-shadow-component.js
 *     open-shadow-component.js
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Custom Elements w/ Closed and Open Shadowrootmode';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/index.js', import.meta.url));
    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    it('should have exactly one open shadowrootmode template', function () {
      expect(
        dom.window.document.querySelectorAll(
          'open-shadow-component template[shadowrootmode="open"]',
        ).length,
      ).to.equal(1);
    });

    it('should have exactly one closed shadowrootmode template', function () {
      expect(
        dom.window.document.querySelectorAll(
          'closed-shadow-component template[shadowrootmode="closed"]',
        ).length,
      ).to.equal(1);
    });
  });
});
