/*
 * Use Case
 * Run wcc against HTML with Light DOM HTML entities in text nodes.
 * 
 * User Result
 * Should return the expected HTML with all the HTML entities preserved.
 *
 * User Workspace
 * src/
 *   components/
 *     ctc-block.js
 */
import chai from 'chai';
import { renderFromHTML } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC ', function() {
  const LABEL = 'Using renderFromHTML with Light DOM HTML entities preserved';

  describe(LABEL, function() {
    let rawHtml;

    before(async function() {
      const { html } = await renderFromHTML(`
        <x-ctc>
          &#x3C;h1>Hello from the server rendered users page! 👋&#x3C;/h1>
        </x-ctc>
        `, 
      [
        new URL('./src/components/ctc-block.js', import.meta.url)
      ]);

      rawHtml = html;
    });

    it('should preserve HTML entities', function() {
      expect(rawHtml).to.contain('&lt;h1&gt;Hello from the server rendered users page! 👋&lt;/h1&gt;');
    });
  });
});