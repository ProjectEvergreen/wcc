export default class Caption extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title');

    this.innerHTML = `
      <div class="caption">
        ${this.innerHTML}
      </div>
    `;
  }
}

customElements.define('wcc-caption', Caption);