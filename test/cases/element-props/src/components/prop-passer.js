import { html, render } from '../renderer.js';

export default class PropPasser extends HTMLElement {
  connectedCallback() {
    const data = { foo: 'bar' };
    render(html`<prop-receiver .data=${data}></prop-receiver>`, this);
  }
}

customElements.define('prop-passer', PropPasser);