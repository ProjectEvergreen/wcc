export const inferredObservability = true;

export default class CounterDsdJsx extends HTMLElement {
  // having a constructor is required for inferredObservability
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      console.log('NO shadowRoot detected for counter-dsd.jsx!');
      this.count = this.getAttribute('count');

      // having an attachShadow call is required for DSD
      this.attachShadow({ mode: 'open' });
      this.render();
    } else {
      console.log('SUCCESS, shadowRoot detected for counter-dsd.jsx!');
    }
  }

  render() {
    const { count } = this;

    return (
      <div style="width: 50%; margin: 0 auto; text-align: center;">
        <button onclick={this.count -= 1}> -</button>
        <span>You have clicked <span class="red">{count}</span> times</span>
        <button onclick={this.count += 1}> +</button>
      </div>
    );
  }
}

customElements.define('sb-counter-dsd-jsx', CounterDsdJsx);