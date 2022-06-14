/*
 * Use Case
 * Run wcc against nested custom elements with declarative shadow dom from an HTML string.
 *
 * User Result
 * Should return the expected HTML output for all levels of element nesting.
 *
 * User Workspace
 * src/
 *   components/
 *     navigation.js
 *     header.js
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderFromHTML } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC ', function() {
  const LABEL = 'Using renderFromHTML';
  let rawHtml;
  let dom;
  let assetMetadata;

  before(async function() {
    const { html, metadata } = await renderFromHTML(`
      <html>
        <head>
          <title>WCC</title>
        </head>
        <body>
          <wcc-header></wcc-header>
          <h1>Home Page</h1>
        </body>
      </html>
    `, [
      new URL('./src/components/header.js', import.meta.url)
    ]);

    rawHtml = html;
    dom = new JSDOM(html);
    assetMetadata = metadata;
  });

  describe(LABEL, function() {
    describe('static page content', function() {
      it('should have the expected <html> tag the page', function() {
        expect(rawHtml.indexOf('<html>') >= 0).to.equal(true);
      });

      it('should have the expected <title> tag the page', function() {
        expect(dom.window.document.querySelectorAll('html').length).to.equal(1);
        expect(dom.window.document.querySelector('title').textContent).to.equal('WCC');
      });

      it('should have the expected <head> tag the page', function() {
        expect(rawHtml.indexOf('<head>') >= 0).to.equal(true);
      });

      it('should have the expected <body> tag the page', function() {
        expect(rawHtml.indexOf('<body>') >= 0).to.equal(true);
      });

      it('should have the expected static content for the page', function() {
        expect(dom.window.document.querySelector('h1').textContent).to.equal('Home Page');
      });
    });

    describe('custom header element with nested navigation element', function() {
      let headerContentsDom;

      before(function() {
        headerContentsDom = new JSDOM(dom.window.document.querySelectorAll('wcc-header template[shadowroot="open"]')[0].innerHTML);
      });

      it('should have a <header> tag within the <template> shadowroot', function() {
        expect(headerContentsDom.window.document.querySelectorAll('header').length).to.equal(1);
      });

      it('should have expected content within the <header> tag', function() {
        const content = headerContentsDom.window.document.querySelector('header a h4').textContent;

        expect(content).to.contain('My Personal Blog');
      });

      describe('nested navigation element', function() {
        let navigationContentsDom;

        before(function() {
          navigationContentsDom = new JSDOM(headerContentsDom.window.document.querySelectorAll('wcc-navigation template[shadowroot="open"]')[0].innerHTML);
        });

        it('should have a <nav> tag within the <template> shadowroot', function() {
          expect(navigationContentsDom.window.document.querySelectorAll('nav').length).to.equal(1);
        });

        it('should have three links within the <nav> element', function() {
          const links = navigationContentsDom.window.document.querySelectorAll('nav ul li a');

          expect(links.length).to.equal(3);
        });
      });
    });

    describe(LABEL, function() {
      it('should have two custom elements in the asset graph', function() {
        expect(Object.keys(assetMetadata).length).to.equal(2);
      });

      it('should have the correct attributes for each asset', function() {
        Object.entries(assetMetadata).forEach((asset) => {
          expect(asset[0]).to.not.be.undefined;
          expect(asset[1].instanceName).to.not.be.undefined;
          expect(asset[1].moduleURL).to.not.be.undefined;
        });
      });
    });
  });
});