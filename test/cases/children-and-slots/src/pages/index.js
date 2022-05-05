import '../components/paragraph.js';

export default class HomePage extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = this.getTemplate();
    }
  }

  getTemplate() {
    return `
      <h1>Home Page</h1>

      <wcc-paragraph class="default"></wcc-paragraph>

      <wcc-paragraph class="custom">
        <span slot="my-text">Let's have some different text!</span>
      </wcc-paragraph>
    `;
  }
}