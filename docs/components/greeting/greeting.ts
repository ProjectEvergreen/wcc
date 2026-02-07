export default class GreetingComponent extends HTMLElement {
  connectedCallback() {
    const name = this.hasAttribute('name') ? this.getAttribute('name') : 'World';

    this.innerHTML = `<span>Hello ${name}!</span>`;
  }
}

customElements.define('wcc-greeting', GreetingComponent);
