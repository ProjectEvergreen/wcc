import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import type { DocsPage } from './side-nav.tsx';
import './side-nav.tsx';

const ROUTE = '/docs/';
const HEADING = 'Docs';

// have to hardcode this since tableOfContents data is not set in the graph
const GRAPH = [
  {
    id: 'docs',
    label: 'Docs',
    title: 'Docs',
    route: '/docs/',
    layout: 'docs',
    data: {
      collection: 'nav',
      order: 2,
      tocHeading: 2,
      tableOfContents: [
        {
          content: 'API',
          slug: 'api',
          lvl: 2,
          i: 1,
          seen: 0,
        },
        {
          content: 'Metadata',
          slug: 'metadata',
          lvl: 2,
          i: 4,
          seen: 0,
        },
        {
          content: 'Progressive Hydration',
          slug: 'progressive-hydration',
          lvl: 2,
          i: 5,
          seen: 0,
        },
        {
          content: 'Data',
          slug: 'data',
          lvl: 2,
          i: 6,
          seen: 0,
        },
        {
          content: 'Conventions',
          slug: 'conventions',
          lvl: 2,
          i: 9,
          seen: 0,
        },
        {
          content: 'TypeScript',
          slug: 'typescript',
          lvl: 2,
          i: 10,
          seen: 0,
        },
        {
          content: 'JSX',
          slug: 'jsx',
          lvl: 2,
          i: 12,
          seen: 0,
        },
      ],
    },
  },
];

// https://stackoverflow.com/questions/45425169/intercept-fetch-api-requests-and-responses-in-javascript
window.fetch = function () {
  return new Promise((resolve) => {
    resolve(new Response(JSON.stringify(GRAPH)));
  });
};

describe('Components/Side Nav', () => {
  let nav: HTMLElement;
  let expectedDocsContent: DocsPage;

  beforeEach(async () => {
    nav = document.createElement('wcc-side-nav');
    nav.setAttribute('route', ROUTE);
    nav.setAttribute('heading', HEADING);

    expectedDocsContent = GRAPH.find((page) => page.route === ROUTE);

    document.body.appendChild(nav);

    // to support async connected callback usage
    await vi.waitUntil(() => nav.querySelector('nav'));
  });

  describe('Default Behavior - Main Menu', () => {
    let fullMenu: HTMLElement;

    beforeEach(async () => {
      fullMenu = nav.querySelector('#main-menu');
    });

    it('should not be null', () => {
      expect(fullMenu).not.equal(undefined);
    });

    it('should have the expected ToC heading', () => {
      const heading = fullMenu.querySelectorAll('p');

      expect(heading.length).to.equal(1);
      expect(heading[0].textContent).to.equal('Table of Contents');
    });

    it('should have the expected number of section heading links', () => {
      const links = fullMenu.querySelectorAll('ul li a');

      expect(links.length).to.equal(expectedDocsContent.data.tableOfContents.length);
    });

    it('should have the expected content for section headings links', () => {
      const links = fullMenu.querySelectorAll('ul li a');

      links.forEach((link, index) => {
        expect(link.textContent).to.equal(expectedDocsContent.data.tableOfContents[index].content);
      });
    });

    afterAll(() => {
      fullMenu = null;
    });
  });

  describe('Default Behavior - Mobile Menu', () => {
    let compactMenu: HTMLElement;
    let popoverSelector = 'compact-menu';

    beforeEach(async () => {
      compactMenu = nav.querySelector(`#mobile-menu`);
    });

    it('should not be null', () => {
      expect(compactMenu).not.equal(undefined);
    });

    it('should have the expected ToC heading', () => {
      const heading = compactMenu.querySelectorAll('p');

      expect(heading.length).to.equal(1);
      expect(heading[0].textContent).to.equal('Table of Contents');
    });

    it('should have the expected popover trigger element', () => {
      const trigger = compactMenu.querySelectorAll(
        `[popovertarget="${popoverSelector}"]:not([popovertargetaction])`,
      );

      expect(trigger.length).to.equal(1);
      expect(trigger[0].textContent).to.contain(HEADING);
    });

    it('should have the expected popover element', () => {
      const popover = compactMenu.querySelectorAll(`[popover="manual"]`);

      expect(popover.length).to.equal(1);
    });

    it('should have the expected popover close button', () => {
      const closeButton = compactMenu.querySelectorAll(
        `[popover="manual"] [popovertarget="${popoverSelector}"]`,
      );

      expect(closeButton.length).to.equal(1);
    });

    it('should have the expected number of section heading links', () => {
      const links = compactMenu.querySelectorAll('ul li a');

      expect(links.length).to.equal(expectedDocsContent.data.tableOfContents.length);
    });

    it('should have the expected content for section headings links', () => {
      const links = compactMenu.querySelectorAll('ul li a');

      links.forEach((link, index) => {
        expect(link.textContent).to.equal(expectedDocsContent.data.tableOfContents[index].content);
      });
    });

    afterEach(() => {
      compactMenu = null;
    });
  });

  afterEach(() => {
    nav.remove();
    nav = undefined;
  });
});
