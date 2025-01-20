export default class FullDocumentComponent extends HTMLElement {

  connectedCallback() {
    this.innerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>App Layout</title>
        </head>

        <body>
          <h1>App Layout</h1>
        </body>
      </html>
    `;
  }
}

customElements.define('full-document-component', FullDocumentComponent);