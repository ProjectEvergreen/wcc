export default class ClosedShadowComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'closed' });
      const template = document.createElement('template');
      template.innerHTML = `
        <h2>Shadow Root Closed</h2>
      `;
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('closed-shadow-component', ClosedShadowComponent);