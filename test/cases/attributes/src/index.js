import './components/counter.js';

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
      <h1>Counter</h1>

      <wcc-counter count="5"></wcc-counter>
    `;
  }
}