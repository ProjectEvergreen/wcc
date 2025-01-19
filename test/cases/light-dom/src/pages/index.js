import '../components/header.js';

export default class HomePage extends HTMLElement {

  connectedCallback() {
    this.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `<!DOCTYPE html>
      <html>
      <head>
          <title>App Layout</title>
        </head>
        <body>
      <wcc-header></wcc-header>

      <h1>Home Page</h1></body></html>
    `;
  }
}