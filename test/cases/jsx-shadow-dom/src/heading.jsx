export default class HeadingComponent extends HTMLElement {
  sayHello() {
    alert('hello world!');
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.render();
    }
  }

  render() {
    return (
      <button onclick={this.sayHello}>Get a greeting!</button>
    );
  }
}

customElements.define('wcc-heading', HeadingComponent);