export const inferredObservability = true;

export default class PrivateHeading extends HTMLElement {
  #greeting = new Signal.State<string>('Hello');

  #sayHello(event: Event) {
    this.#greeting.set(event.type);
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    return (
      <h1 title={this.#greeting.get()} onclick={this.#sayHello}>
        {this.#greeting.get()}
      </h1>
    );
  }
}

customElements.define('wcc-private-heading', PrivateHeading);
