export default class Page extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <body>
        <h1>Hello from JSX page</h1>
      </body>
    );
  }
}

customElements.define('wcc-page', Page);
