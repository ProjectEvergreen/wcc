import './components/serializable-ssr-component.js';
import './components/serializable-non-ssr-component.js';
import './components/unserializable-ssr-component.js';
import './components/unserializable-non-ssr-component.js';

export default class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <serializable-ssr-component></serializable-ssr-component>
      <serializable-non-ssr-component></serializable-non-ssr-component>
      <unserializable-ssr-component></unserializable-ssr-component>
      <unserializable-non-ssr-component></unserializable-non-ssr-component>
    `;
  }
}

customElements.define('wcc-home', HomePage);