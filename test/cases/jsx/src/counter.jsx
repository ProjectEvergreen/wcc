export default class Counter extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  increment() {
    this.count += 1;
    this.render();
  }

  decrement() {
    this.count -= 1;
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
        <button onclick={this.decrement}> -  (function reference)</button>
        <button onclick={this.count -= 1}> - (inline state update) </button>
        <span>You have clicked <span class="red">{count}</span> times</span>
        <button onclick={this.count += 1}> + (inline state update)</button>
        <button onclick={this.increment}> + (function reference)</button>
      </div>
    );
  }
}

customElements.define('wcc-counter-jsx', Counter);