/*
 * Use Case
 * Run wcc against a custom elements using TypeScript
 *
 * User Result
 * Should return the expected HTML and JavaScript output.
 *
 * User Workspace
 * src/
 *   greeting.ts
 *   app.ts
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Single Custom Element using TypeScript';
  let dom;

  before(async function() {
    const { html } = await renderToString(new URL('./src/app.ts', import.meta.url));

    dom = new JSDOM(html);
  });

  describe(LABEL, function() {

    describe('Greeting component in TypeScript', function() {
      let headings;

      before(async function() {
        headings = dom.window.document.querySelectorAll('h3');
      });

      it('should server render the expected greeting', () => {
        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal('Hello TypeScript!');
      });
    });
  });
});