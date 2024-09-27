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
 *     picture-frame.js
 *   pages/
 *     index.js
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'HTML Web Component';
  let dom;
  let pictureFrame;

  before(async function() {
    const { html } = await renderToString(new URL('./src/pages/index.js', import.meta.url));

    dom = new JSDOM(html);
    pictureFrame = dom.window.document.querySelectorAll('wcc-picture-frame');
  });

  describe(LABEL, function() {
    it('should not have any <template> tags within the document', function() {
      expect(dom.window.document.querySelectorAll('template').length).to.equal(0);
    });

    it('should only have one <wcc-picture-frame> tag', function() {
      expect(pictureFrame.length).to.equal(1);
    });

    it('should have the expected title attribute content in the heading of HTML', () => {
      const heading = pictureFrame[0].querySelectorAll('.picture-frame .heading');

      expect(heading.length).to.equal(1);
      expect(heading[0].textContent).to.equal('Greenwood');
    });

    it('should have the expected image from userland in the HTML', () => {
      const img = pictureFrame[0].querySelectorAll('.picture-frame img');

      expect(img.length).to.equal(1);
      expect(img[0].getAttribute('alt')).to.equal('Greenwood logo');
      expect(img[0].getAttribute('src')).to.equal('https://www.greenwoodjs.io/assets/greenwood-logo-og.png');
    });
  });
});