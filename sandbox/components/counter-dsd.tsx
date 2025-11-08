export const inferredObservability = true;

export default class CounterDsdTsx extends HTMLElement {
  count: number;

  connectedCallback() {
    if (!this.shadowRoot) {
      console.warn('NO shadowRoot detected for counter-dsd.jsx!');
      this.count = parseInt(this.getAttribute('count')) || 0;

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
        <button onclick={(this.count -= 1)}> -</button>
        {/* `<img> tag here to make sure types work */}
        <img width={10} />
        <span>
          You have clicked <span class="red">{count}</span> times
        </span>
        <button onclick={(this.count += 1)}> +</button>
      </div>
    );
  }
}

customElements.define('sb-counter-dsd-tsx', CounterDsdTsx);
