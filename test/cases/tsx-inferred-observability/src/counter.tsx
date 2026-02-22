export const inferredObservability = true;

export default class Counter extends HTMLElement {
  // TODO: get Signal types for this
  count: any;
  parity: any;

  constructor() {
    super();
    this.count = new Signal.State(0);
    this.parity = new Signal.Computed(() => (this.count.get() % 2 === 0 ? 'even' : 'odd'));
  }

  increment() {
    this.count.set(this.count.get() + 1);
  }

  decrement() {
    this.count.set(this.count.get() - 1);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { count, parity } = this;

    return (
      <div>
        <h3 data-test="hello123">Counter JSX</h3>
        <button id="evt-this" onclick={this.decrement}>
          {' '}
          - (function reference)
        </button>
        <button id="evt-assignment" onclick={(this.count -= 1)}>
          {' '}
          - (inline state update)
        </button>
        <span id="one-deep" data-count={count.get()}>
          Top level count is {count.get()}
        </span>
        {/* TODO: test for nested signals */}
        <span id="two-deep">
          You have clicked{' '}
          <span class="red" id="expression">
            {count.get()}
          </span>{' '}
          times
        </span>
        <span id="three-deep">Parity is: {parity.get()}</span>
        <button onclick={() => count.set(count.get() + 1)}> + (inline state update)</button>
        <button onclick={this.increment}> + (function reference)</button>
      </div>
    );
  }
}

customElements.define('wcc-counter-tsx', Counter);
