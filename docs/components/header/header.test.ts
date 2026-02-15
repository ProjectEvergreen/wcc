import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import pages from '../../../.greenwood/graph.json' with { type: 'json' };
import type { Page } from '@greenwood/cli';
import './header.tsx';

const CURRENT_ROUTE = '/docs/';

describe('Components/Header', () => {
  let header: HTMLElement;

  beforeAll(() => {
    window.fetch = vi.fn((): Promise<Response> => {
      return new Promise((resolve) => {
        resolve(
          new Response(JSON.stringify(pages.filter((page) => page.data.collection === 'nav'))),
        );
      });
    });
  });

  beforeEach(async () => {
    header = document.createElement('wcc-header');
    header.setAttribute('current-route', CURRENT_ROUTE);

    document.body.appendChild(header);

    // to support async connected callback usage
    await vi.waitUntil(() => header.querySelector('header'));
  });

  describe('Default Behavior', () => {
    it('should not be null', () => {
      expect(header).not.equal(undefined);
      expect(header.querySelectorAll('header').length).equal(1);
    });

    it('should have an anchor tag with title attribute wrapping the logo', () => {
      const anchor = header.querySelector("a[title='WCC Home Page']");

      expect(anchor).to.not.equal(undefined);
      expect(anchor.getAttribute('href')).to.equal('/');
    });

    it('should have the WCC logo', () => {
      const logo = header.querySelectorAll("a[title='WCC Home Page'] svg");

      expect(logo.length).equal(1);
      expect(logo[0]).not.equal(undefined);
    });

    it('should have the expected desktop navigation links', () => {
      const links = header.querySelectorAll("nav[aria-label='Main'] ul li a");
      let activeRoute: Page;

      Array.from(links).forEach((link, idx) => {
        const navItem = pages.find((nav) => nav.route === link.getAttribute('href'));

        expect(navItem).to.not.equal(undefined);
        expect(navItem.data.order).to.equal((idx += 1));
        expect(link.textContent).to.equal(navItem.label);

        // Home page doesn't have a title, for example
        // maybe a Greenwood bug?
        if (navItem.title) {
          expect(link.getAttribute('title')).to.equal(navItem.title);
        }

        // current route should display as active
        if (navItem.route === CURRENT_ROUTE && link.getAttribute('class').includes('active')) {
          activeRoute = navItem;
        }
      });

      expect(activeRoute.route).to.equal(CURRENT_ROUTE);
    });
  });

  describe('Mobile Menu', () => {
    const popoverTarget = 'mobile-menu';

    it('should have the expected mobile menu icon button', () => {
      const mobileIconButton = header.querySelectorAll(
        "button[aria-label='Mobile Menu Icon Button']",
      );

      expect(mobileIconButton.length).to.equal(1);
      expect(mobileIconButton[0].getAttribute('popovertarget')).to.equal(popoverTarget);
    });

    it('should have the expected popover overlay container', () => {
      const overlay = header.querySelectorAll(`#${popoverTarget}`);

      expect(overlay.length).to.equal(1);
      expect(overlay[0].getAttribute('popover')).to.equal('manual');
    });

    it('should have the expected close button', () => {
      const mobileCloseButton = header.querySelectorAll(
        "button[aria-label='Mobile Menu Close Button']",
      );

      expect(mobileCloseButton.length).to.equal(1);
      expect(mobileCloseButton[0].getAttribute('popovertarget')).to.equal(popoverTarget);
      expect(mobileCloseButton[0].getAttribute('popovertargetaction')).to.equal('hide');
    });

    it('should have the expected navigation links', () => {
      const links = header.querySelectorAll("nav[aria-label='Mobile'] ul li a");
      let activeRoute: Page = undefined;

      Array.from(links).forEach((link, idx) => {
        const navItem = pages.find((nav) => nav.route === link.getAttribute('href'));

        expect(navItem).to.not.equal(undefined);
        expect(navItem.data.order).to.equal((idx += 1));
        expect(link.textContent).to.equal(navItem.label);

        // Home page doesn't have a title, for example
        // maybe a Greenwood bug?
        if (navItem.title) {
          expect(link.getAttribute('title')).to.equal(navItem.title);
        }

        // current route should display as active
        if (navItem.route === CURRENT_ROUTE && link.getAttribute('class').includes('active')) {
          activeRoute = navItem;
        }
      });

      expect(activeRoute.route).to.equal(CURRENT_ROUTE);
    });
  });

  afterEach(() => {
    header.remove();
    header = undefined;
  });

  afterAll(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });
});
