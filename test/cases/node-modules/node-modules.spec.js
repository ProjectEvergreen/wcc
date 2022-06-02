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

import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function() {
  const LABEL = 'Custom Element w/ a node modules dependency';

  describe(LABEL, function() {
    it('should not fai when the content load a node module', function() {
      Promise.resolve(renderToString(new URL('./src/index.js', import.meta.url)));
    });
  });
});