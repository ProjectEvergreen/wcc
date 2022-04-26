import '../components/footer.js';
import '../components/header.js';

export default class AboutPage extends HTMLElement {
  constructor() {
    super();

    if (this.shadowRoot) {
      console.debug('AboutPage => shadowRoot detected!');
    } else {
      this.attachShadow({ mode: 'open' });
    }

    this.shadowRoot.innerHTML = `
      <wcc-header></wcc-header>
      <h1>About Page</h1>
      <wcc-footer></wcc-footer>
    `;
  }
}