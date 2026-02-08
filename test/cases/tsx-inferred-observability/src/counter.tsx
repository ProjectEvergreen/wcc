export const inferredObservability = true;

export default class Counter extends HTMLElement {
  // TODO: get Signal types for this
  count: any;

  constructor() {
    super();
    this.count = new Signal.State(0);
  }

  increment() {
    this.count.set(this.count.get() + 1);
    this.render();
  }

  decrement() {
    this.count.set(this.count.get() - 1);
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { count } = this;

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
        <span>
          You have clicked{' '}
          <span class="red" id="expression">
            {count.get()}
          </span>{' '}
          times
        </span>
        <button onclick={() => count.set(count.get() + 1)}> + (inline state update)</button>
        <button onclick={this.increment}> + (function reference)</button>
      </div>
    );
  }
}

customElements.define('wcc-counter-tsx', Counter);
