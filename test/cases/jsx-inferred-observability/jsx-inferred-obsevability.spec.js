/*
 * Use Case
 * Run wcc against a custom element using JSX render function with inferredObservability enabled
 *
 * User Result
 * Should return the expected JavaScript output.
 *
 * User Workspace
 * src/
 *   counter.jsx
 */
import chai from 'chai';
import fs from 'fs/promises';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Single Custom Element using JSX and Inferred Observability';
  let fixtureAttributeChangedCallback;
  let fixtureGetObservedAttributes;
  let meta;

  before(async function() {
    const { metadata } = await renderToString(new URL('./src/counter.jsx', import.meta.url));

    meta = metadata;

    fixtureAttributeChangedCallback = await fs.readFile(new URL('./fixtures/attribute-changed-callback.txt', import.meta.url), 'utf-8');
    fixtureGetObservedAttributes = await fs.readFile(new URL('./fixtures/get-observed-attributes.txt', import.meta.url), 'utf-8');
  });

  describe(LABEL, function() {

    describe('<Counter> component w/ <Badge> and Inferred Observability', function() {

      it('should infer observability by generating a get observedAttributes method', () => {
        const actual = meta['wcc-counter-jsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureGetObservedAttributes.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });

      it('should infer observability by generating an attributeChangedCallback method', () => {
        const actual = meta['wcc-counter-jsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureAttributeChangedCallback.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });
    });
  });
});