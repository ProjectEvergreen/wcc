import '../components/footer.js';
import '../components/header.js';

const template = document.createElement('template');

template.innerHTML = `
  <wcc-header></wcc-header>

  <h1>Home Page</h1>

  <wcc-footer></wcc-footer>
`;

export default class HomePage extends HTMLElement {
  constructor() {
    super();

    if (this.shadowRoot) {
      // console.debug('HomePage => shadowRoot detected!');
    } else {
      this.attachShadow({ mode: 'open' });
    }
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = template.innerHTML;
  }
}

customElements.define('wcc-home', HomePage);