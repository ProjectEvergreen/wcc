import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './ctc-button.tsx';

describe('Components/Copy To Clipboard (Button)', () => {
  const content = 'npm i -D wc-compiler';
  let ctc: HTMLElement;

  beforeEach(async () => {
    ctc = document.createElement('wcc-ctc-button');

    ctc.setAttribute('content', content);
    document.body.appendChild(ctc);
  });

  describe('Default Behavior', () => {
    it('should not be null', () => {
      expect(ctc).not.equal(undefined);
    });

    it('should have an icon with the user provided content set', () => {
      const icon = ctc.shadowRoot.querySelectorAll("[title='Copy to clipboard']");

      expect(icon.length).to.equal(1);
    });
  });

  afterEach(() => {
    ctc.remove();
    ctc = undefined;
  });
});
