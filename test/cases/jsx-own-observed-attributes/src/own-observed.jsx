export const inferredObservability = true;

export default class OwnObserved extends HTMLElement {
  static get observedAttributes() {
    return ['label'];
  }

  constructor() {
    super();
    this.count = new Signal.State(0);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.label = newValue;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { count } = this;

    return (
      <div>
        <span>{count.get()}</span>
      </div>
    );
  }
}

customElements.define('wcc-own-observed', OwnObserved);
