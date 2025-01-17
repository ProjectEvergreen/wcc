export default class ClosedShadowComponent extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'closed' });
      const template = document.createElement('template');
      template.innerHTML = `
        <h1>Shadow Root Closed</h1>
      `;
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('closed-shadow-component', ClosedShadowComponent);