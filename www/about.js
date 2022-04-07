import './components/footer.js';
import './components/header.js';

export default class AboutPage extends HTMLElement {
  constructor() {
    super();

    if(this.shadowRoot) {
      console.debug('AboutPage => shadowRoot detected!')
    }

    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = `
      <wcc-header></wcc-header>
      <h1>About Page</h1>
      <wcc-footer></wcc-footer>
    `;
  }
}