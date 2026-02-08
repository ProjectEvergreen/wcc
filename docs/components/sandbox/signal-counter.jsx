export const inferredObservability = true;

export default class SignalCounter extends HTMLElement {
  constructor() {
    super();
    this.count = new Signal.State(0);
    this.parity = new Signal.Computed(() => (this.count.get() % 2 === 0 ? 'even' : 'odd'));
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({
        mode: 'open',
      });
      this.render();
    }
  }

  increment() {
    this.count.set(this.count.get() + 1);
    console.log('increment', this.count.get());
  }

  decrement() {
    this.count.set(this.count.get() - 1);
    console.log('decrement', this.count.get());
  }

  render() {
    const { count, parity } = this;

    return (
      <div>
        <button onclick={this.increment}>Increment (+)</button>
        <button onclick={this.decrement}>Decrement (-)</button>
        <button onclick={() => this.count.set(this.count.get() * 2)}>Double (++)</button>
        <span>
          The count is {count.get()} ({parity.get()})
        </span>
      </div>
    );
  }
}

customElements.define('sb-signal-counter-jsx', SignalCounter);
