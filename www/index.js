import './components/header.js';

export default class HomePage extends HTMLElement {
  constructor() {
    super();

    if(this.shadowRoot) {
      console.debug('HomePage => shadowRoot detected!')
    }

    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `
      <wcc-header></wcc-header>
      <h1>Home Page</h1>
    `;
  }
}