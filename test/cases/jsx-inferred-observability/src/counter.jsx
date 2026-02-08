import './badge.jsx';

export const inferredObservability = true;

export default class Counter extends HTMLElement {
  constructor() {
    super();
    this.count = new Signal.State(0);
    this.highlight = new Signal.State('red');
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
    const { count, highlight } = this;

    return (
      <div>
        <wcc-badge count={this.count.get()}></wcc-badge>
        <h3 data-test="hello123">Counter JSX</h3>
        <button id="evt-this" onclick={this.decrement}>
          {' '}
          - (function reference)
        </button>
        <button id="evt-assignment" onclick={() => this.count.set(this.count.get() - 1)}>
          {' '}
          - (inline state update)
        </button>
        <span>
          You have clicked{' '}
          <span class={highlight.get()} id="expression">
            {count.get()}
          </span>{' '}
          times
        </span>
        <button onclick={() => this.count.set(this.count.get() + 1)}>
          {' '}
          + (inline state update)
        </button>
        <button onclick={this.increment}> + (function reference)</button>
      </div>
    );
  }
}

customElements.define('wcc-counter-jsx', Counter);
