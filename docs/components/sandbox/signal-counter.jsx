import sheet from './signal-counter.css' with { type: 'css' };

export const inferredObservability = true;

export default class SignalCounter extends HTMLElement {
  constructor() {
    super();
    this.count = new Signal.State(0);
    this.parity = new Signal.Computed(() => (this.count.get() % 2 === 0 ? 'even' : 'odd'));
    this.isLarge = new Signal.Computed(() =>
      this.count.get() >= 100 ? 'Wow!!!' : 'Keep Going...',
    );
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({
        mode: 'open',
      });
      this.render();
    }

    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  increment() {
    this.count.set(this.count.get() + 1);
  }

  decrement() {
    this.count.set(this.count.get() - 1);
  }

  double() {
    this.count.set(this.count.get() * 2);
  }

  render() {
    const { count, parity, isLarge } = this;

    return (
      <div>
        <button onclick={this.increment}>Increment (+)</button>
        <button onclick={this.decrement}>Decrement (-)</button>
        {/* TODO: inline version breaks with effects */}
        {/* <button onclick={() => this.count.set(this.count.get() * 2)}>Double (++)</button> */}
        <button onclick={this.double}>Double (++)</button>
        <span class={parity.get()}>
          The count is {count.get()} ({parity.get()})
        </span>
        <span>{isLarge.get()}</span>
        <p data-count={count.get()}>{isLarge.get()}</p>
      </div>
    );
  }
}

customElements.define('sb-signal-counter-jsx', SignalCounter);
