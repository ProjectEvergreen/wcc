export default class Counter extends HTMLElement {
  constructor() {
    super();
    console.debug('constructor');
    this.count = 0;
  }

  increment() {
    console.debug('increment');
    this.count += 1;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    console.debug('render');
    const { count } = this;

    return (
      <div>
        <p>You clicked {count} times</p>
        <button onclick={() => this.increment()}>
          Click me
        </button>
      </div>
    );
  }
}

// TODO handle this working when customElements.define is NOT used
// e.g. layouts
customElements.define('wcc-counter', Counter);