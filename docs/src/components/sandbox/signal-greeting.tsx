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

    return (
      <h3 style="text-align: center" data-name={name.get()}>
        Hello {name.get()} 👋
      </h3>
    );
  }
}

customElements.define('sb-signal-greeting-jsx', SignalGreeting);
