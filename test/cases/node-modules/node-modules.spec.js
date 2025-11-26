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
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function () {
  const LABEL = 'Custom Element w/ a node modules dependency';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/index.js', import.meta.url));

    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    it('should not fail when a node module is imported in a custom element', function () {
      expect(dom).to.not.be.undefined;
    });
  });
});
