import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './capability-box.tsx';

describe('Components/Capability Box', () => {
  let capabilityBox: HTMLElement;

  describe('Default Behavior', () => {
    beforeEach(() => {
      capabilityBox = document.createElement('wcc-capability-box');

      document.body.appendChild(capabilityBox);
    });

    it('should not be undefined', () => {
      expect(capabilityBox).not.equal(undefined);
    });

    it('should not have any heading text', () => {
      const heading = capabilityBox.querySelectorAll('h4');

      expect(heading.length).equal(1);
      expect(heading[0].textContent).equal('');
    });
  });

  describe('Custom Text and Heading', () => {
    const customHeading = 'JSX';
    const customContent = 'This is a custom feature box';

    beforeEach(() => {
      capabilityBox = document.createElement('wcc-capability-box');
      capabilityBox.innerHTML = `<p>${customContent}</p>`;
      capabilityBox.setAttribute('heading', customHeading);

      document.body.appendChild(capabilityBox);
    });

    it('should not be undefined', () => {
      expect(capabilityBox).not.equal(undefined);
    });

    it('should have the expected text from setting the heading attribute', () => {
      const heading = capabilityBox.querySelectorAll('h4');

      expect(heading.length).equal(1);
      expect(heading[0].textContent).equal(customHeading);
    });

    it('should have the expected inner HTML text', () => {
      const paragraph = capabilityBox.querySelectorAll('p');

      expect(paragraph.length).equal(1);
      expect(paragraph[0].textContent).equal(customContent);
    });
  });

  afterEach(() => {
    capabilityBox.remove();
    capabilityBox = undefined;
  });
});
