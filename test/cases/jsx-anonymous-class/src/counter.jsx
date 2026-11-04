export const inferredObservability = true;

class Counter extends HTMLElement {
  constructor() {
    super();
    this.count = new Signal.State(0);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { count } = this;

    return (
      <div>
        <span id="count">Count: {count.get()}</span>
      </div>
    );
  }
}

customElements.define('wcc-anon-counter', Counter);

export default Counter;
