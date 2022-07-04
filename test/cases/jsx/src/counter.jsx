export default class Counter extends HTMLElement {
  constructor() {
    super();
    console.debug('constructor');
    this.count = 0;
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

  connectedCallback() {
    this.render();
  }

  render() {
    console.debug('render');
    const { count } = this;

    return (
      <div>
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
customElements.define('wcc-counter-jsx', Counter);