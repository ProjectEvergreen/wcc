const template = document.createElement('template');

template.innerHTML = '<p>This is the NoExportComponent component.</p>';

class NoExportComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('app-no-export-example', NoExportComponent);