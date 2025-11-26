import { getContentByCollection } from '@greenwood/cli/src/data/client.js';
import type { Page } from '@greenwood/cli';
import styles from './header.module.css';

type NavItem = Page & {
  data: {
    order: number;
  };
};

export default class Header extends HTMLElement {
  currentRoute: string;
  navItems: NavItem[];

  constructor() {
    super();
    this.currentRoute = '';
    this.navItems = [];
  }

  async connectedCallback() {
    this.currentRoute = this.getAttribute('current-route') ?? '';
    this.navItems = ((await getContentByCollection('nav')) as NavItem[]).sort((a, b) =>
      a.data.order > b.data.order ? 1 : -1,
    );
    this.render();
  }

  render() {
    const navHtml = this.navItems
      .map((item) => {
        const { route, label } = item;
        const isActiveClass = this.currentRoute.startsWith(item.route) ? 'class="active"' : '';

        return `
        <li class="${styles.navBarMenuItem}">
          <a href="${route}" ${isActiveClass} title="${label}">${label}</a>
        </li>
      `;
      })
      .join('');

    return (
      <header class="${styles.container}">
        <span>WCC Logo</span>
        {navHtml}
      </header>
    );
  }
}

customElements.define('wcc-header', Header);
