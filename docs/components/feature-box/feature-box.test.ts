import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './feature-box.tsx';

describe('Components/Feature Box', () => {
  let featureBox: HTMLElement;

  describe('Default Behavior', () => {
    beforeEach(() => {
      featureBox = document.createElement('wcc-feature-box');

      document.body.appendChild(featureBox);
    });

    it('should not be undefined', () => {
      expect(featureBox).not.equal(undefined);
    });

    it('should not have any heading text', () => {
      const heading = featureBox.querySelectorAll('h4');

      expect(heading.length).equal(1);
      expect(heading[0].textContent.trim()).equal('');
    });

    it('should not have an SVG mapped logo', () => {
      const logo = featureBox.querySelectorAll('svg');

      expect(logo.length).equal(0);
    });
  });

  describe('Custom Text and Heading', () => {
    const customHeading = 'JSX';
    const customContent = 'This is a custom feature box';

    beforeEach(() => {
      featureBox = document.createElement('wcc-feature-box');
      featureBox.innerHTML = `<p>${customContent}</p>`;
      featureBox.setAttribute('heading', customHeading);

      document.body.appendChild(featureBox);
    });

    it('should not be undefined', () => {
      expect(featureBox).not.equal(undefined);
    });

    it('should have the expected text from setting the heading attribute', () => {
      const heading = featureBox.querySelectorAll('h4');

      expect(heading.length).equal(1);
      expect(heading[0].textContent.trim()).equal(customHeading);
    });

    it('should have the expected inner HTML text', () => {
      const paragraph = featureBox.querySelectorAll('p');

      expect(paragraph.length).equal(1);
      expect(paragraph[0].textContent).equal(customContent);
    });

    it('should not a mapped SVG logo', () => {
      const logo = featureBox.querySelectorAll('svg');

      expect(logo.length).equal(1);
    });
  });

  afterEach(() => {
    featureBox.remove();
    featureBox = undefined;
  });
});
