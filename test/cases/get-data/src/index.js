import './components/counter.js';

export default class HomePage extends HTMLElement {

  connectedCallback() {
    this.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `
      <h1>Counter</h1>

      <wcc-counter></wcc-counter>
    `;
  }
}