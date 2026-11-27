export const inferredObservability = true;

export default class Greeting extends HTMLElement {
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

    return <h3 data-name={name.get()}>Hello {name.get()} 👋</h3>;
  }
}

customElements.define('wcc-greeting-jsx', Greeting);
