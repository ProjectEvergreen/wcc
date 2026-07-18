/*
 * Use Case
 * Run wcc against a custom element that reads a signal directly off `this` in its JSX
 * render function (e.g. {this.count.get()}) with inferredObservability enabled, instead
 * of destructuring the signal first (const { count } = this; ... {count.get()}).
 *
 * User Result
 * Should render the signal's value (The count is 0) rather than compiling to
 * ${undefined.get()} and crashing SSR with "Cannot read properties of undefined".
 *
 * User Workspace
 * src/
 *   counter.jsx
 */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function () {
  const LABEL = 'Custom Element reading a signal directly off `this` in JSX';

  describe(LABEL, function () {
    let html;
    let source;
    let dom;

    before(async function () {
      const { html: renderedHtml, metadata } = await renderToString(
        new URL('./src/counter.jsx', import.meta.url),
      );

      html = renderedHtml;
      source = metadata['wcc-this-signal-read'].source;
      dom = new JSDOM(html);
    });

    it('should render the signal value for {this.count.get()} read directly in JSX', function () {
      const shadowRoot = dom.window.document.querySelector(
        'wcc-this-signal-read template[shadowrootmode="open"]',
      );
      const innerDom = new JSDOM(shadowRoot.innerHTML).window.document;
      const paragraph = innerDom.querySelector('p#count');

      expect(paragraph.textContent.trim()).to.equal('The count is 0');
    });

    it('should not compile a direct this-signal read down to undefined.get()', function () {
      expect(html).to.not.contain('undefined.get()');
      expect(source).to.not.contain('undefined.get()');
    });

    it('should compile {this.count.get()} to a scoped this-read in the render template', function () {
      expect(source).to.contain('this.count.get()');
    });
  });
});
