export default class HeaderJsx extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <header>
        <p>Welcome to my site w/ JSX</p>
      </header>
    );
  }
}

customElements.define('sb-header-jsx', HeaderJsx);
