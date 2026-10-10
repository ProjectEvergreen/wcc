/*
 * Use Case
 * Run WCC against a custom element that imports already-compiled JavaScript.
 *
 * User Result
 * Should parse the dependency without passing it through Sucrase.
 *
 * User Workspace
 * src/
 *   contentful-error.js
 *   index.js
 */
import { expect } from 'chai';
import { renderToString } from '../../../src/wcc.js';

// https://github.com/ProjectEvergreen/wcc/issues/284
describe('Run WCC For ', function () {
  const LABEL = 'Custom Element with a JavaScript dependency';

  describe(LABEL, function () {
    it('should not transform compiled JavaScript dependencies', async function () {
      const { html } = await renderToString(new URL('./src/index.js', import.meta.url));

      expect(html).to.contain('Compiled JavaScript parsed successfully');
    });
  });
});
