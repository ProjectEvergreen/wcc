/*
 * Use Case
 * Run wcc against a JSX component whose render function returns a document-level
 * `<body>` root (natural for a "page" component).
 *
 * User Result
 * Should serialize only the body fragment's children, NOT a nested full
 * `<html><head></head><body>...</body></html>` document inlined into the outer page.
 *
 * User Workspace
 * src/
 *   page.jsx
 */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function () {
  const LABEL = 'JSX Component with a <body> document root';
  let dom;
  let output;

  before(async function () {
    const { html } = await renderToString(new URL('./src/page.jsx', import.meta.url));

    output = html;
    dom = new JSDOM(html);
  });

  describe(LABEL, function () {
    describe('<wcc-page> component', function () {
      it('should render the intended content', () => {
        const heading = dom.window.document.querySelector('wcc-page h1');

        expect(heading).to.not.be.null;
        expect(heading.textContent.trim()).to.be.equal('Hello from JSX page');
      });

      it('should NOT emit a nested <html> document wrapper', () => {
        expect(output).to.not.contain('<html>');
      });

      it('should NOT emit a nested <head> document wrapper', () => {
        expect(output).to.not.contain('<head>');
      });

      it('should NOT emit a nested <body> document wrapper', () => {
        expect(output).to.not.contain('<body>');
      });
    });
  });
});
