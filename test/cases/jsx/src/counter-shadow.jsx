export default class CounterShadow extends HTMLElement {
  constructor() {
    super();
    console.debug('constructor');
    this.count = 0;
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.render();
  }

  increment() {
    console.debug('increment');
    this.count += 1;
    this.render();
  }

  decrement() {
    console.debug('decrement');
    this.count -= 1;
    this.render();
  }

  render() {
    console.debug('render');
    const { count } = this;

    return (
      <div>
        <h3>CounterShadow JSX</h3>
        <button onclick={this.decrement}> -  (function reference) </button>
        <span>You have clicked <span id="count" class="red">{count}</span> times</span>
        <button onclick={this.count += 1}> + (inline state update) </button>
        <button onclick={this.increment}> + (function reference) </button>
      </div>
    );
  }
}

// TODO handle this working when customElements.define is NOT used
// e.g. layouts
customElements.define('wcc-counter-jsx-shadow', CounterShadow);