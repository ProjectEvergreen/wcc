const template = document.createElement('template');

template.innerHTML = `
  <header>
    <h1>Welcome to my website!</h1>
  </header>
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync('li{color:red;}');

export default class Header extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    this.shadowRoot.adoptedStyleSheets = [sheet];
  }
}

customElements.define('wcc-header', Header);