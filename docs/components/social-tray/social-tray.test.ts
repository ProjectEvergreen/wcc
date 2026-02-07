import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './social-tray.tsx';

const ICONS = [
  {
    link: 'https://github.com/ProjectEvergreen/wcc',
    title: 'GitHub',
  },
  {
    link: 'https://www.greenwoodjs.dev/discord/',
    title: 'Discord',
  },
  {
    link: 'https://bsky.app/profile/projectevergreen.bsky.social',
    title: 'BlueSky',
  },
  {
    link: 'https://twitter.com/PrjEvergreen',
    title: 'Twitter',
  },
];

describe('Components/Social Tray', () => {
  let tray: HTMLElement;

  beforeEach(async () => {
    tray = document.createElement('wcc-social-tray');

    document.body.appendChild(tray);
  });

  describe('Default Behavior', () => {
    it('should not be null', () => {
      expect(tray).not.equal(undefined);
      expect(tray.querySelectorAll('ul').length).equal(1);
    });

    it('should have the expected social link icons', () => {
      const links = tray.querySelectorAll('ul li a');
      const icons = tray.querySelectorAll('ul li a svg');
      const noShowScreenReader = tray.querySelectorAll('ul li a span.no-show-screen-reader');

      expect(links.length).to.equal(4);
      expect(icons.length).to.equal(4);
      expect(noShowScreenReader.length).to.equal(4);

      Array.from(links).forEach((link) => {
        const iconItem = ICONS.find((icon) => icon.title === link.getAttribute('title'));

        expect(iconItem).to.not.equal(undefined);
        expect(link.getAttribute('href')).to.equal(iconItem.link);
        expect(link.getAttribute('target')).equal('_blank');
      });
    });
  });

  afterEach(() => {
    tray.remove();
    tray = undefined;
  });
});
