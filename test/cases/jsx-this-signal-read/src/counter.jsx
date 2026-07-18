export const inferredObservability = true;

export default class ThisSignalCounter extends HTMLElement {
  constructor() {
    super();
    this.count = new Signal.State(0);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.render();
  }

  render() {
    // read the signal directly off `this` in JSX, without destructuring first
    return <p id="count">The count is {this.count.get()}</p>;
  }
}

customElements.define('wcc-this-signal-read', ThisSignalCounter);
