export const inferredObservability = true;

export default class PrivateSignals extends HTMLElement {
  #count;
  #parity;

  constructor() {
    super();
    this.count = new Signal.State(100);
    this.#count = new Signal.State(0);
    this.#parity = new Signal.Computed(() => (this.#count.get() % 2 === 0 ? 'even' : 'odd'));
  }

  #increment() {
    this.#count.set(this.#count.get() + 1);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const count = this.#count;
    return (
      <section title={this.#parity.get()}>
        <span data-count={count.get()}>Alias: {count.get()}</span>
        <p data-count={this.#count.get()}>Direct: {this.#count.get()}</p>
        <button onclick={this.#increment}>Increment</button>
        <p>Public: {this.count.get()}</p>
      </section>
    );
  }
}

customElements.define('wcc-private-signals', PrivateSignals);
