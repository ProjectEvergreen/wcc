/*
 * Use Case
 * Run wcc against a JSX component whose inline arrow event handlers contain
 * double-quoted string literals (including strings that mention the word "this").
 *
 * User Result
 * Should serialize each handler into a single, well-formed `onclick` attribute:
 * the double quotes inside the handler must be escaped so they can't terminate the
 * attribute (no stray boolean attributes), and `this` must only be rewritten to the
 * component scope for real `ThisExpression`s, never inside string literals.
 *
 * User Workspace
 * src/
 *   alerter.jsx
 */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function () {
  const LABEL = 'JSX inline arrow event handler containing a double-quoted string';
  let dom;

  before(async function () {
    const { html } = await renderToString(new URL('./src/alerter.jsx', import.meta.url));

    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    // <button onclick={() => alert("this rocks, click this button")}>
    describe('a handler with a double-quoted string that mentions "this"', function () {
      let button;

      before(function () {
        button = dom.window.document.querySelector('button#evt-string');
      });

      it('should render a single, well-formed onclick attribute with no stray boolean attributes', () => {
        expect(button).to.not.be.null;
        expect(button.getAttributeNames()).to.deep.equal(['id', 'onclick']);
      });

      it('should keep the string literal intact and NOT mangle "this" inside it', () => {
        const onclick = button.getAttribute('onclick');

        expect(onclick).to.contain('this rocks, click this button');
        expect(onclick).to.not.contain('self.rocks');
        expect(onclick).to.not.contain('self.button');
      });
    });

    // <button onclick={() => this.greet("this is a message")}>
    describe('a handler mixing a real `this` member access with a "this" string', function () {
      let button;

      before(function () {
        button = dom.window.document.querySelector('button#evt-mixed');
      });

      it('should render a single, well-formed onclick attribute with no stray boolean attributes', () => {
        expect(button).to.not.be.null;
        expect(button.getAttributeNames()).to.deep.equal(['id', 'onclick']);
      });

      it('should rewrite the real `this` to the component scope but leave the string literal alone', () => {
        const onclick = button.getAttribute('onclick');

        expect(onclick).to.contain('self.greet(');
        expect(onclick).to.contain('this is a message');
        expect(onclick).to.not.contain('self.is a message');
      });
    });
  });
});
