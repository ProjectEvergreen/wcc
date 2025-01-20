export default class OpenShadowComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      const template = document.createElement('template');
      template.innerHTML = `
        <h2>Shadow Root Open</h2>
      `;
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('open-shadow-component', OpenShadowComponent);
