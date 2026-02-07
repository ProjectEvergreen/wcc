import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './footer.tsx';

describe('Components/Footer', () => {
  let footer: HTMLElement;

  describe('Default Behavior', () => {
    beforeEach(async () => {
      footer = document.createElement('wcc-footer');

      document.body.appendChild(footer);
    });

    it('should not be undefined', () => {
      expect(footer).not.equal(undefined);
      expect(footer.querySelectorAll('footer').length).equal(1);
    });

    it('should have a link for to the home page', () => {
      const homeLink = footer.querySelectorAll('a[title="WCC Home Page"]');

      expect(homeLink.length).equal(1);
      expect(homeLink[0].getAttribute('href')).equal('/');
    });

    it('should have the WCC logo inside the home page link', () => {
      const logo = footer.querySelectorAll('a[title="WCC Home Page"] > svg');

      expect(logo.length).equal(1);
    });

    it('should have one instance of the social tray component', () => {
      const socialTray = footer.querySelectorAll('wcc-social-tray');

      expect(socialTray.length).equal(1);
    });
  });

  afterEach(() => {
    footer.remove();
    footer = undefined;
  });
});
