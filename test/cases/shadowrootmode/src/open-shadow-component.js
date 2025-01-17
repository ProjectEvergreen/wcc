export default class OpenShadowComponent extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      const template = document.createElement('template');
      template.innerHTML = `
        <h1>Shadow Root Open</h1>
      `;
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('open-shadow-component', OpenShadowComponent);