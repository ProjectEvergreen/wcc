import { html, render } from '../renderer.js';

export default class ProperReceiver extends HTMLElement {
  connectedCallback() {
    render(html`<h2>${this.data.foo}</h2>`, this);
  }
}

customElements.define('prop-receiver', ProperReceiver);