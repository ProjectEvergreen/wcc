export const inferredObservability = true;

export default class PrivateSignalCounter extends HTMLElement {
  #count = new Signal.State(0);
  #label = new Signal.Computed(() => `Count: ${this.#count.get()}`);

  #increment() {
    this.#count.set(this.#count.get() + 1);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <div style="text-align: center;">
        <p title={this.#label.get()}>{this.#label.get()}</p>
        <button onclick={this.#increment}>Increment</button>
        <button onclick={() => this.#count.set(0)}>Reset</button>
      </div>
    );
  }
}

customElements.define('sb-private-signal-counter-tsx', PrivateSignalCounter);
