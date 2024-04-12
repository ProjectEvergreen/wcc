import '../components/header/header.js';

export default class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <wcc-header></wcc-header>
      <h1>Home Page</h1>
    `;
  }
}