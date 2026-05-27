/*
 * Use Case
 * Run wcc against a nested custom elements using JSX render function and Declarative Shadow DOM.
 *
 * User Result
 * Should return the expected HTML and JavaScript output.
 *
 * User Workspace
 * src/
 *   heading.jsx
 */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function () {
  const LABEL = 'Single Custom Element using JSX and Declarative Shadow DOM';
  let dom;
  let meta;

  before(async function () {
    const { html, metadata } = await renderToString(new URL('./src/heading.jsx', import.meta.url));

    meta = metadata;
    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    describe('<wcc-heading> component', function () {
      let heading;

      before(async function () {
        heading = dom.window.document.querySelector('wcc-heading template[shadowrootmode="open"]');
      });

      describe('Metadata', () => {
        it('should return a JSX definition in metadata', () => {
          expect(Object.keys(meta).length).to.equal(1);
          expect(meta['wcc-heading'].source).to.not.be.undefined;
        });
      });

      describe('Declarative Shadow DOM (<template> tag)', () => {
        it('should handle a this expression', () => {
          expect(heading).to.not.be.undefined;
        });
      });

      describe('Event Handling', () => {
        // <button onclick={this.sayHello}>Get a greeting!</button>
        it('should handle a this expression', () => {
          const wrapper = new JSDOM(heading.innerHTML);
          const button = Array.from(wrapper.window.document.querySelectorAll('button')).find(
            (button) => button.getAttribute('id') === 'evt-this',
          );

          expect(button.getAttribute('onclick')).to.be.equal('this.getRootNode().host.sayHello()');
        });

        // <button onclick={(e) => { console.log({ e }); }}> Click Me</button>
        it('should handle an inline event handler with custom event identifier', () => {
          const wrapper = new JSDOM(heading.innerHTML);
          const button = Array.from(wrapper.window.document.querySelectorAll('button')).find(
            (button) => button.getAttribute('id') === 'evt-inline',
          );

          expect(button.getAttribute('onclick').trim().replace(/\s+/g, '')).to.be.equal(
            '(function(e,self){{console.log({e});}})(event,this.getRootNode().host)',
          );
        });
      });

      describe('Attribute Contents', () => {
        it('should handle a this expression', () => {
          const wrapper = new JSDOM(heading.innerHTML);
          const header = wrapper.window.document.querySelector('h1');

          expect(header.textContent.trim()).to.be.equal('Hello, World!');
        });
      });
    });
  });
});
