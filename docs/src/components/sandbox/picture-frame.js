export default class PictureFrame extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title');

    // should handle for pre-rendering (has double output)
    this.innerHTML = `
      <div class="picture-frame">
        <h6 class="heading">${title}</h6>
        ${this.innerHTML}
      </div>
    `;
  }
}

customElements.define('sb-picture-frame', PictureFrame);
