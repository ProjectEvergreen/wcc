import './caption.js';

export default class PictureFrame extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title');

    this.innerHTML = `
      <div class="picture-frame">
        <wcc-caption>
          <h6 class="heading">${title}</h6>
        </wcc-caption>
        ${this.innerHTML}
      </div>
    `;
  }
}

customElements.define('wcc-picture-frame', PictureFrame);