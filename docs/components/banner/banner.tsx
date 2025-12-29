export default class Banner extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <p>
        WCC is a NodeJS package for easier server-rendering (SSR) of native Web Components. It can
        render your Web Components to static HTML supporting either Light DOM or Declarative Shadow
        DOM.
      </p>
    );
  }
}

customElements.define('wcc-banner', Banner);
