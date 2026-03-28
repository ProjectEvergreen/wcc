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
 *   greeting.tsx
 */
import chai from 'chai';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function () {
  const LABEL = 'Custom Elements using TSX and Inferred Observability';
  const effectImport = `import{effect}from'wc-compiler/effect';`;

  describe(LABEL, function () {
    let fixtureAttributeChangedCallback;
    let fixtureGetObservedAttributes;
    let fixtureStaticTemplates;
    let fixtureEffects;
    let meta;
    let dom;

    describe('<Counter> component w/ <Badge> and Inferred Observability', function () {
      before(async function () {
        const { html, metadata } = await renderToString(
          new URL('./src/counter.tsx', import.meta.url),
        );

        meta = metadata;
        dom = new JSDOM(html);

        fixtureAttributeChangedCallback = await fs.readFile(
          new URL('./fixtures/counter/attribute-changed-callback.txt', import.meta.url),
          'utf-8',
        );
        fixtureGetObservedAttributes = await fs.readFile(
          new URL('./fixtures/counter/get-observed-attributes.txt', import.meta.url),
          'utf-8',
        );
        fixtureStaticTemplates = await fs.readFile(
          new URL('./fixtures/counter/static-templates.txt', import.meta.url),
          'utf-8',
        );
        fixtureEffects = await fs.readFile(
          new URL('./fixtures/counter/effects.txt', import.meta.url),
          'utf-8',
        );
      });

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

      it('should infer observability by generating a static attribute method', () => {
        const actual = meta['wcc-counter-tsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureStaticTemplates.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });

      it('should infer observability by generating an effects method', () => {
        const actual = meta['wcc-counter-tsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureEffects.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });

      it("should infer observability by generating an import for WCC's effect function", () => {
        const actual = meta['wcc-counter-tsx'].source.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(effectImport);
      });

      // <span id="one-deep" data-count={count.get()}>Top level count is {count.get()}</span>
      it('should have the expected value for the nested count signal', () => {
        const span = dom.window.document.querySelector('wcc-counter-tsx span#one-deep');

        expect(span.textContent.trim()).to.equal('Top level count is 0');
        expect(span.getAttribute('data-count')).to.equal('0');
      });

      // <span>You have clicked{' '}<span class="red" id="expression">{count.get()}</span>times</span>
      it('should have the expected value for the nested count signal', () => {
        const span = dom.window.document.querySelector(
          'wcc-counter-tsx span#two-deep span[class="red"]',
        );

        expect(span.textContent.trim()).to.equal('0');
      });

      // <span id="three-deep">Parity is: {parity.get()}</span>
      it('should have the expected value for a signal used in another tag with the same name', () => {
        const span = dom.window.document.querySelector('wcc-counter-tsx span#three-deep');

        expect(span.textContent.trim()).to.equal('Parity is: even');
      });

      // <span id="non-reactive">Just some non-reactive text</span>
      it('should have the expected static content for a non-reactive element that has the same tag as another reactive tag', () => {
        const span = dom.window.document.querySelector('wcc-counter-tsx span#non-reactive');

        expect(span.textContent).to.equal('Just some static text');
      });
    });

    describe('<Greeting> component and Inferred Observability', function () {
      let fixtureAttributeChangedCallback;
      let fixtureGetObservedAttributes;
      let fixtureStaticTemplates;
      let fixtureEffects;
      let meta;
      let dom;

      before(async function () {
        const { html, metadata } = await renderToString(
          new URL('./src/greeting.tsx', import.meta.url),
        );

        fixtureAttributeChangedCallback = await fs.readFile(
          new URL('./fixtures/greeting/attribute-changed-callback.txt', import.meta.url),
          'utf-8',
        );
        fixtureGetObservedAttributes = await fs.readFile(
          new URL('./fixtures/greeting/get-observed-attributes.txt', import.meta.url),
          'utf-8',
        );
        fixtureStaticTemplates = await fs.readFile(
          new URL('./fixtures/greeting/static-templates.txt', import.meta.url),
          'utf-8',
        );
        fixtureEffects = await fs.readFile(
          new URL('./fixtures/greeting/effects.txt', import.meta.url),
          'utf-8',
        );

        meta = metadata;
        dom = new JSDOM(html);
      });

      it('should infer observability by generating a get observedAttributes method', () => {
        const actual = meta['wcc-greeting-jsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureGetObservedAttributes.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });

      it('should infer observability by generating an attributeChangedCallback method', () => {
        const actual = meta['wcc-greeting-jsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureAttributeChangedCallback.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });

      it('should infer observability by generating a static attribute method', () => {
        const actual = meta['wcc-greeting-jsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureStaticTemplates.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });

      it('should infer observability by generating an effects method', () => {
        const actual = meta['wcc-greeting-jsx'].source.replace(/ /g, '').replace(/\n/g, '');
        const expected = fixtureEffects.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(expected);
      });

      it("should infer observability by generating an import for WCC's effect function", () => {
        const actual = meta['wcc-greeting-jsx'].source.replace(/ /g, '').replace(/\n/g, '');

        expect(actual).to.contain(effectImport);
      });

      // <h3>Hello {name.get()} 👋</h3>
      it('should have the expected value for a top level tag with reactive content', () => {
        const heading = dom.window.document.querySelector('wcc-greeting-jsx h3');

        expect(heading.textContent.trim()).to.equal('Hello World 👋');
      });

      // <h3 data-name={name.get()}>Hello {name.get()} 👋</h3>
      it('should have the expected value for a top level tag with reactive attributes', () => {
        const heading = dom.window.document.querySelector('wcc-greeting-jsx h3');

        expect(heading.getAttribute('data-name')).to.equal('World');
      });
    });
  });
});
