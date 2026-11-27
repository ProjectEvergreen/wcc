export default class ShadowFragments extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  greet() {}

  render() {
    return (
      <>
        <h1>Hello</h1>
        <>
          <button id="reference" onclick={this.greet}>
            Greet
          </button>
          <button id="inline" onclick={() => this.greet()}>
            Greet
          </button>
        </>
      </>
    );
  }
}

customElements.define('wcc-shadow-fragments', ShadowFragments);
