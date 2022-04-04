import { Header } from './components/header.js';

export default class HomePage extends HTMLElement {
  constructor() {
    super();

    if(this.shadowRoot) {
      console.debug('shadowRoot detected!')
    } else {
      // customElements.define('wcc-header', Header);
    }

    // create a Shadow root
    this.root = this.attachShadow({ mode: 'open' });
  }

  // run some code when the component is ready
  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  // create templates that interpolate variables and HTML!
  getTemplate() {
    const imageUrl = new URL('./assets/greenwood-logo.jpg', import.meta.url);

    return `
      <wcc-header></wcc-header>
      <h1>Home Page</h1>
    `;
  }
}