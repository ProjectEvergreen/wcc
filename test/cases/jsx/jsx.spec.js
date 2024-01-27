/*
 * Use Case
 * Run wcc against a nested custom elements using JSX render function
 *
 * User Result
 * Should return the expected HTML and JavaScript output.
 *
 * User Workspace
 * src/
 *   badge.jsx
 *   counter.jsx
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Single Custom Element using JSX';
  let dom;
  let meta;

  before(async function() {
    const { html, metadata } = await renderToString(new URL('./src/counter.jsx', import.meta.url));

    console.log({ html });
    meta = metadata;
    dom = new JSDOM(html);
  });

  describe(LABEL, function() {

    describe('<Counter> component w/ <Badge>', function() {
      let buttons;

      before(async function() {
        buttons = dom.window.document.querySelectorAll('button');
      });

      describe('Metadata', () => {
        it('should return a JSX definition in metadata', () => {
          expect(Object.keys(meta).length).to.equal(2);
          expect(meta['wcc-counter-jsx'].source).to.not.be.undefined;
          expect(meta['wcc-badge'].source).to.not.be.undefined;
        });
      });

      describe('Attributes', () => {
        // <wcc-badge count={completedTodos.length}></wcc-badge>
        it('should handle a member expression', () => {
          const badge = dom.window.document.querySelectorAll('wcc-badge')[0];
          const span = badge.querySelectorAll('span')[0];

          expect(badge.getAttribute('count')).to.be.equal('0');
          expect(span.getAttribute('class')).to.be.equal('unmet');
          expect(span.textContent).to.be.equal('0');
        });
      });

      describe('Event Handling', () => {
        // <button onclick={this.decrement}> - </button>
        it('should handle a this expression', () => {
          const element = Array.from(buttons).find(button => button.getAttribute('id') === 'evt-this');

          expect(element.getAttribute('onclick')).to.be.equal('this.parentElement.parentElement.decrement()');
        });

        // <button onclick={this.count -= 1}> - </button>
        it('should handle an assignment expression with implicit reactivity using this.render', () => {
          const element = Array.from(buttons).find(button => button.getAttribute('id') === 'evt-assignment');

          expect(element.getAttribute('onclick'))
            .to.be.equal('this.parentElement.parentElement.count-=1; this.parentElement.parentElement.setAttribute(\'count\', this.parentElement.parentElement.count);');
        });
      });

      describe('Expressions', () => {
        // <span>You have clicked {count} times</span>
        it('should handle an expression', () => {
          const element = dom.window.document.querySelectorAll('span#expression')[0];

          expect(element.textContent).to.be.equal('0');
        });    
      });

      describe('Inferred Observability', () => {
        it('should not infer observability by default', () => {
          const actual = meta['wcc-counter-jsx'].source.replace(/ /g, '').replace(/\n/g, '');

          expect(actual).to.not.contain('staticgetobservedAttributes()');
          expect(actual).to.not.contain('attributeChangedCallback');
        });
      });
    });
  });
});