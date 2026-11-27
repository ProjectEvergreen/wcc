const template = document.createElement('template');

template.innerHTML = '<p>This is the NoDefineComponent component.</p>';

// eslint-disable-next-line no-unused-vars
class NoDefineComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}
