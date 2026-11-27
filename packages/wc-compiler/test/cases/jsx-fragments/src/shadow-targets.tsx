export const inferredObservability = true;

export default class ShadowFragmentTargets extends HTMLElement {
  count;

  constructor() {
    super();
    this.count = new Signal.State(0);
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  $$root() {
    return 'authored';
  }

  increment() {
    this.count.set(this.count.get() + 1);
  }

  render() {
    const { count } = this;
    return (
      <>
        <div>
          <span>Nested static</span>
          <button>Nested static</button>
        </div>
        <span data-count={count.get()}>{count.get()}</span>
        <button onclick={this.increment}>Root</button>
      </>
    );
  }
}

customElements.define('wcc-shadow-fragment-targets', ShadowFragmentTargets);
