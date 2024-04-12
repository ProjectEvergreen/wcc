import data from './data.json' with { type: 'json' };

export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <nav>
          <ul>
            ${data.links.map((item) => `<li>${item}</li>`).join('\n')}
          </ul>
        </nav>
      </header>
    `;
  }
}

customElements.define('wcc-header', Header);