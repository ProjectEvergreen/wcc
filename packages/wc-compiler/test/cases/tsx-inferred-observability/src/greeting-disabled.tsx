export const inferredObservability = false;

export default class GreetingDisabled extends HTMLElement {
  name;

  constructor() {
    super();
    this.name = new Signal.State('World');
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { name } = this;

    return <h3 data-name={name.get()}>Hello {name.get()} 👋</h3>;
  }
}

customElements.define('wcc-greeting-disabled-tsx', GreetingDisabled);
