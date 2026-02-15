import type { Page, Graph } from '@greenwood/cli';
import { getContent } from '@greenwood/cli/src/data/client.js';
import styles from './side-nav.module.css';

export type TableOfContents = Array<{
  content: string;
  slug: string;
}>;

export type DocsPage = Page & {
  data?: {
    tableOfContents?: TableOfContents;
  };
};

export default class SideNav extends HTMLElement {
  route: string;
  toc: TableOfContents;
  heading: string;

  async connectedCallback() {
    const route = this.getAttribute('route') ?? '';
    const heading = this.getAttribute('heading') ?? '';
    const page: DocsPage = (await getContent()).find((page) => page.route === route);

    this.heading = heading;
    this.toc = page?.data?.tableOfContents ?? [];

    this.render();
  }

  render() {
    const { heading } = this;
    const tocList = this.toc
      .map((item) => {
        return `<li><a href="#${item.slug}">${item.content}</a></li>`;
      })
      .join('');

    return (
      <nav>
        <div id="main-menu" class={styles.fullMenu}>
          <p class={styles.tableOfContentHeader}>Table of Contents</p>
          <ul>{tocList}</ul>
        </div>

        <div id="mobile-menu" class={styles.compactMenu}>
          <button
            popovertarget="compact-menu"
            class={styles.compactMenuPopoverTrigger}
            aria-label="Compact Menu Open Button"
          >
            {heading}
            <span id="indicator">&#9660;</span>
          </button>
          <div id="compact-menu" class={styles.compactMenuPopover} popover="manual">
            <button
              class={styles.compactMenuCloseButton}
              popovertarget="compact-menu"
              popovertargetaction="hide"
              aria-label="Compact Menu Close Button"
            >
              &times;
            </button>
            <p class={styles.tableOfContentHeader}>Table of Contents</p>
            <ul>{tocList}</ul>
          </div>
        </div>
      </nav>
    );
  }
}

customElements.define('wcc-side-nav', SideNav);
