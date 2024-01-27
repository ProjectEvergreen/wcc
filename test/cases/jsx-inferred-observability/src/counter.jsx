export const inferredObservability = true;

export default class Counter extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
    this.highlight = 'red';
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
    const { count, highlight } = this;

    return (
      <div>
        <wcc-badge count={count}></wcc-badge>
        <h3 data-test="hello123">Counter JSX</h3>
        <button id="evt-this" onclick={this.decrement}> -  (function reference)</button>
        <button id="evt-assignment" onclick={this.count -= 1}> - (inline state update)</button>
        <span>You have clicked <span class={highlight} id="expression">{count}</span> times</span>
        <button onclick={this.count += 1}> + (inline state update)</button>
        <button onclick={this.increment}> + (function reference)</button>
      </div>
    );
  }
}

customElements.define('wcc-counter-jsx', Counter);