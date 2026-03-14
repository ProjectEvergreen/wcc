export const inferredObservability = true;

export default class SignalGreeting extends HTMLElement {
  name;

  constructor() {
    super();
    this.name = new Signal.State('World');
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.render();
  }

  render() {
    const { name } = this;

    // TODO: just using <h3> breaks
    return (
      <div>
        <h3 style="text-align: center">Hello {name.get()} 👋</h3>
      </div>
    );
  }
}

customElements.define('sb-signal-greeting-jsx', SignalGreeting);
