export const inferredObservability = false;

export default class CounterObservabilityFalse extends HTMLElement {
  constructor() {
    super();
    this.count = new Signal.State(0);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({
        mode: 'open',
      });
      this.render();
    }
  }

  render() {
    const label = 'The count is static';

    return (
      <div>
        <span id="label">{label}</span>
      </div>
    );
  }
}

customElements.define('wcc-counter-observability-false', CounterObservabilityFalse);
