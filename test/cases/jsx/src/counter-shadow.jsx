export default class CounterShadow extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.render();
  }

  render() {
    const { count } = this;

    return (
      <div>
        <button onclick={this.count -= 1}> - (inline state update) </button>
        <span>You have clicked <span class="red">{count}</span> times</span>
        <button onclick={this.count += 1}> + (inline state update) </button>
      </div>
    );
  }
}

customElements.define('wcc-counter-jsx-shadow', CounterShadow);