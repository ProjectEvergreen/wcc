import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './banner-splash.tsx';

describe('Components/Banner Splash', () => {
  let bannerSplash: HTMLElement;

  describe('Default Behavior', () => {
    beforeEach(() => {
      bannerSplash = document.createElement('wcc-banner-splash');

      document.body.appendChild(bannerSplash);
    });

    it('should not be undefined', () => {
      expect(bannerSplash).not.equal(undefined);
    });

    it('should have to the expected heading text', () => {
      const heading = bannerSplash.querySelectorAll('h1');

      expect(heading.length).equal(1);
      expect(heading[0].textContent.trim().replace(/\s+/g, ' ')).equal('SSR for Web Components');
    });
  });

  afterEach(() => {
    bannerSplash.remove();
    bannerSplash = undefined;
  });
});
