import { Header } from './components/header.js';

export default class AboutPage extends HTMLElement {
  constructor() {
    super();

    if(this.shadowRoot) {
      console.debug('shadowRoot detected!')
    }

    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = `
      <wcc-header></wcc-header>
      <h1>About Page</h1>
    `;
  }
}