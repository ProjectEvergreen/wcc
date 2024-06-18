import './greeting.ts';

export default class App extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <wcc-greeting name="WCC"></wcc-greeting>
    `;
  }
}

customElements.define('wcc-app', App);