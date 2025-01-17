import './open-shadow-component.js';
import './closed-shadow-component.js';

export default class HomePage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <open-shadow-component></open-shadow-component>
      <closed-shadow-component></closed-shadow-component>
    `;
  }
}

customElements.define('wcc-home', HomePage);