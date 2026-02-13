import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './banner-cta.tsx';

describe('Components/Banner CTA', () => {
  let bannerCta: HTMLElement;

  describe('Default Behavior', () => {
    const cta = 'npm i -D wc-compiler';

    beforeEach(() => {
      bannerCta = document.createElement('wcc-banner-cta');

      document.body.appendChild(bannerCta);
    });

    it('should not be undefined', () => {
      expect(bannerCta).not.equal(undefined);
    });

    it('should have the main overview text', () => {
      const paragraph = bannerCta.querySelectorAll('p');

      expect(paragraph.length).equal(1);
      expect(paragraph[0].textContent.trim().replace(/\s+/g, ' ')).toContain(
        'WCC (WC Compiler) is a NodeJS based package for server-rendering native Web Components.',
      );
    });

    it('should have the copy to clipboard snippet', () => {
      const pre = bannerCta.querySelectorAll('pre');

      expect(pre.length).equal(1);
      expect(pre[0].textContent.trim()).equal(`$ ${cta}`);
    });

    it('should have the copy to clipboard component', () => {
      const ctcButton = bannerCta.querySelectorAll('wcc-ctc-button');

      expect(ctcButton.length).equal(1);
      expect(ctcButton[0].getAttribute('content')).equal(cta);
    });
  });

  afterEach(() => {
    bannerCta.remove();
    bannerCta = undefined;
  });
});
