import '../components/footer.js';
import '../components/header.js';

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
    this.shadowRoot.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `
      <wcc-header></wcc-header>

      <h1>Home Page</h1>

      <wcc-footer hydrate="lazy"></wcc-footer>
    `;
  }
}
