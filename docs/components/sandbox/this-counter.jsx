export const inferredObservability = true;

export default class ThisCounter extends HTMLElement {
  constructor() {
    super();
    this.count = new Signal.State(2);
    this.parity = new Signal.Computed(() => (this.count.get() % 2 ? 'odd' : 'even'));
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.render();
  }

  increment() {
    this.count.set(this.count.get() + 1);
  }

  render() {
    const { count: total } = this;
    // No destructuring declaration is needed to infer `this.count.get()`.
    // `<p data-count={this.count.get()}>The count is {this.count.get()}</p>`
    return (
      <section>
        <button title={total.get()} onclick={() => this.increment()}>
          Increment
        </button>
        <p>Alias count: {total.get()}</p>
        <h2 title={this.count.get()}>Count: {this.count.get()}</h2>
        <p data-count={this.count.get()}>The count is {this.count.get()}</p>
        <span class={this.parity.get()}>{this.parity.get()}</span>
      </section>
    );
  }
}

customElements.define('sb-this-counter-jsx', ThisCounter);
