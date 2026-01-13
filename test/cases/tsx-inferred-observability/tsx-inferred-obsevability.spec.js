/*
 * Use Case
 * Run wcc against a custom element using JSX render function with inferredObservability enabled written in TypeScript.
 *
 * User Result
 * Should return the expected JavaScript output.
 *
 * User Workspace
 * src/
 *   counter.tsx
 */
import chai from 'chai';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Single Custom Element using TSX and Inferred Observability';
  let fixtureAttributeChangedCallback;
  let fixtureGetObservedAttributes;
  let meta;
  let dom;

  before(async function () {
    const { html, metadata } = await renderToString(new URL('./src/counter.tsx', import.meta.url));

    meta = metadata;
    dom = new JSDOM(html);

    fixtureAttributeChangedCallback = await fs.readFile(
      new URL('./fixtures/attribute-changed-callback.txt', import.meta.url),
      'utf-8',
    );
    fixtureGetObservedAttributes = await fs.readFile(
      new URL('./fixtures/get-observed-attributes.txt', import.meta.url),
      'utf-8',
    );
  });

  describe(LABEL, function () {
    describe('<Counter> component w/ <Badge> and Inferred Observability', function () {
      it('should infer observability by generating a get observedAttributes method', () => {
        const actual = meta['wcc-counter-tsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureGetObservedAttributes.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });

      it('should infer observability by generating an attributeChangedCallback method', () => {
        const actual = meta['wcc-counter-tsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureAttributeChangedCallback.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });

      // <span class="red" id="expression" data-wcc-count="0" data-wcc-ins="text">0</span>
      it('should have the expected observability attributes on the <wcc-counter-tsx> component', () => {
        const span = dom.window.document.querySelector('wcc-counter-tsx span[class="red"]');

        expect(span.getAttribute('data-wcc-count')).to.equal('0');
        expect(span.getAttribute('data-wcc-ins')).to.equal('text');
        expect(span.textContent.trim()).to.equal('0');
      });
    });
  });
});
