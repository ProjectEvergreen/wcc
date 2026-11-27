export const inferredObservability = true;

export default class Fragments extends HTMLElement {
  count;

  constructor() {
    super();
    this.count = new Signal.State(0);
  }

  connectedCallback() {
    this.render();
  }

  increment() {
    this.count.set(this.count.get() + 1);
  }

  render() {
    const { count } = this;
    const value = '<safe> & sound';

    return (
      <>
        <div>
          <>
            <button id="nested" onclick={this.increment}>
              Increment
            </button>
            <span>Static sibling</span>
            <span id="child-reactive" data-count={count.get()}>
              Count: <>{count.get()}</>
            </span>
          </>
        </div>
        <p id="fragment-text">
          <>
            Value: <>{value}</>
          </>
        </p>
        <button id="root" onclick={() => this.increment()}>
          Increment
        </button>
        <>
          <p id="root-reactive" data-count={count.get()}>
            Count: <>{count.get()}</>
          </p>
          <></>
        </>
      </>
    );
  }
}

customElements.define('wcc-fragments-jsx', Fragments);
