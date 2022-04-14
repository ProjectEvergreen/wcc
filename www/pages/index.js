import '../components/counter.js';
import '../components/footer.js';
import '../components/header.js';

export default class HomePage extends HTMLElement {
  constructor() {
    super();

    console.debug('HomePage constructor')

    if(this.shadowRoot) {
      console.debug('HomePage => shadowRoot detected!')
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
      <wcc-counter></wcc-counter>
      <wcc-counter count="5"></wcc-counter>

      <wcc-footer></wcc-footer>
    `;
  }
}