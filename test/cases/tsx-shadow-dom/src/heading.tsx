export default class HeadingComponent extends HTMLElement {
  greeting: string;

  sayHello() {
    alert(`Hello, ${this.greeting}!`);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.greeting = this.getAttribute('greeting') || 'World';

      this.attachShadow({ mode: 'open' });
      this.render();
    }
  }

  render() {
    const { greeting } = this;

    return (
      <div>
        <h1>Hello, {greeting}!</h1>
        <button onclick={this.sayHello}>Get a greeting!</button>
      </div>
    );
  }
}

customElements.define('wcc-heading', HeadingComponent);
