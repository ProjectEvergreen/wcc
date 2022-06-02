import './components/events-list.js';

export default class HomePage extends HTMLElement {
  constructor() {
    super();

    if (this.shadowRoot) {
      // console.debug('HomePage => shadowRoot detected!');
    } else {
      this.attachShadow({ mode: 'open' });
    }
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `
      <wc-events-list></wc-events-list>
    `;
  }
}