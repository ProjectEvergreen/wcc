export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <p>Welcome to my site</p>
      </header>
    `;
  }
}

customElements.define('sb-header', Header);