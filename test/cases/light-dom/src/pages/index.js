import '../components/header.js';

export default class HomePage extends HTMLElement {

  connectedCallback() {
    this.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `
      <wcc-header></wcc-header>

      <h1>Home Page</h1>
    `;
  }
}