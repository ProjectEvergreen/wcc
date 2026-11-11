export default class PrivateCounter extends HTMLElement {
  #count = 0;

  #label() {
    return `Count: ${this.#count}`;
  }

  #increment() {
    this.#count += 1;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <div style="text-align: center;">
        <p title={this.#label()}>{this.#label()}</p>
        <button onclick={this.#increment}>Increment</button>
        <button
          onclick={() => {
            this.#count = 0;
            this.render();
          }}
        >
          Reset
        </button>
      </div>
    );
  }
}

customElements.define('sb-private-counter-jsx', PrivateCounter);
