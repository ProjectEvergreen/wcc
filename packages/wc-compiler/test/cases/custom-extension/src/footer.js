import './banner.js';

const template = document.createElement('template');

template.innerHTML = `
  <footer class="footer">
    <wcc-banner></wcc-banner>
  </footer>
`;

class Footer extends HTMLElement {
  constructor() {
    super();

    if (this.shadowRoot) {
      console.debug('Footer => shadowRoot detected!');
    }
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export default Footer;

customElements.define('wcc-footer', Footer);
