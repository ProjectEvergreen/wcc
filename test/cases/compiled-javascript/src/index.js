import './contentful-error.js';

export default class CompiledJavaScriptElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<h1>Compiled JavaScript parsed successfully</h1>';
  }
}

customElements.define('wcc-compiled-javascript', CompiledJavaScriptElement);
