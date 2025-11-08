export const inferredObservability = true;

export default class CounterJsx extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    this.count = parseInt(this.getAttribute('count'), 10) || this.count;
    this.render();
  }

  render() {
    const { count } = this;

    return (
      <div style="width: 50%; margin: 0 auto; text-align:center;">
        <button onclick={(this.count -= 1)}> -</button>
        <span>
          You have clicked <span class="red">{count}</span> times
        </span>
        <button onclick={(this.count += 1)}> +</button>
      </div>
    );
  }
}

customElements.define('sb-counter-jsx', CounterJsx);
