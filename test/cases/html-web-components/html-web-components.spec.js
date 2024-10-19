/*
 * Use Case
 * Run wcc against an "HTML" Web Component.
 * https://blog.jim-nielsen.com/2023/html-web-components/
 *
 * User Result
 * Should return the expected HTML with no template tags or Shadow Roots.
 *
 * User Workspace
 * src/
 *   components/
 *     caption.js
 *     picture-frame.js
 *   pages/
 *     index.js
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'HTML (Light DOM) Web Components';
  let dom;
  let pictureFrame;
  let expectedHtml;
  let actualHtml;

  before(async function() {
    const { html } = await renderToString(new URL('./src/pages/index.js', import.meta.url));

    actualHtml = html;
    dom = new JSDOM(actualHtml);
    pictureFrame = dom.window.document.querySelectorAll('wcc-picture-frame');
    expectedHtml = await fs.readFile(new URL('./expected.html', import.meta.url), 'utf-8');
  });

  describe(LABEL, function() {
    it('should not have any <template> tags within the document', function() {
      expect(dom.window.document.querySelectorAll('template').length).to.equal(0);
    });

    it('should only have one <wcc-picture-frame> tag', function() {
      expect(pictureFrame.length).to.equal(1);
    });

    it('should have the expected image from userland in the HTML', () => {
      const img = pictureFrame[0].querySelectorAll('.picture-frame img');

      expect(img.length).to.equal(1);
      expect(img[0].getAttribute('alt')).to.equal('Greenwood logo');
      expect(img[0].getAttribute('src')).to.equal('https://www.greenwoodjs.io/assets/greenwood-logo-og.png');
    });

    it('should have the expected Author name <span> from userland in the HTML', () => {
      const img = pictureFrame[0].querySelectorAll('.picture-frame img + br + span');

      expect(img.length).to.equal(1);
      expect(img[0].textContent).to.equal('Author: WCC');
    });

    it('should have the expected title attribute content in the nested <wcc-caption> tag', () => {
      const caption = pictureFrame[0].querySelectorAll('.picture-frame wcc-caption .caption');
      const heading = caption[0].querySelectorAll('.heading');

      expect(caption.length).to.equal(1);
      expect(heading.length).to.equal(1);
      expect(heading[0].textContent).to.equal('Greenwood');
    });

    it('should have the expected copyright content in the nested <wcc-caption> tag', () => {
      const caption = pictureFrame[0].querySelectorAll('.picture-frame wcc-caption .caption');
      const span = caption[0].querySelectorAll('span');

      expect(span.length).to.equal(1);
      expect(span[0].textContent).to.equal('© 2024');
    });

    it('should have the expected recursively generated HTML', () => {
      expect(expectedHtml.replace(/ /g, '').replace(/\n/g, '')).to.equal(actualHtml.replace(/ /g, '').replace(/\n/g, ''));
    });
  });
});