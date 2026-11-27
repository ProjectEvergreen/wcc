import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderFromHTML } from 'wc-compiler';

describe('JSX line breaks', () => {
  let document;

  before(async () => {
    const { html } = await renderFromHTML('<wcc-line-breaks></wcc-line-breaks>', [
      new URL('./src/line-breaks.jsx', import.meta.url),
    ]);
    document = new JSDOM(html).window.document;
  });

  for (const [id, count] of [
    ['single', 1],
    ['multiple', 2],
    ['saved', 1],
    ['array', 2],
  ]) {
    it(`renders exactly ${count} authored breaks for ${id} JSX, preserving surrounding text`, () => {
      const paragraph = document.querySelector(`#${id}`);

      expect(paragraph.innerHTML).to.equal(`One${'<br>'.repeat(count)}Two`);
    });
  }
});
