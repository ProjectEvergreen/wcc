export default class SetAttributeElement extends HTMLElement {
  connectedCallback() {
    const heading = document.createElement('h2');
    heading.setAttribute('foo', 'bar');
    this.appendChild(heading);
  }
}

customElements.define('set-attribute-element', SetAttributeElement);
