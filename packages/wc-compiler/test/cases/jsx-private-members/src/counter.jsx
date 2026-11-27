export default class PrivateCounter extends HTMLElement {
  #count = 0;
  #title = 'Private <counter> & "label"';
  #details = { label: 'Count' };
  #reset = (event) => {
    this.#count = event.detail;
    this.render();
  };

  get #label() {
    return `${this.#details?.label}: ${this.#count}`;
  }

  #getTitle() {
    return this.#title;
  }

  static #format(value) {
    return `Value: ${value}`;
  }

  #increment(event) {
    this.#count += Number(event.currentTarget.getAttribute('data-step'));
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    // Exercise generated-name collisions and captured render-local variables.
    const $evEl0 = 2;
    const $evRoot0 = 0;
    const event = 3;
    return (
      <section title={this.#title}>
        <p>{this.#label}</p>
        <p>{PrivateCounter.#format(this.#count)}</p>
        <p id="title">{this.#getTitle()}</p>
        <div innerHTML={'<aside><button id="nested">Nested content</button></aside>'}></div>
        <button id="method" data-step="1" onclick={this.#increment}>
          Increment
        </button>
        <button
          id="arrow"
          onclick={(e) => {
            e.preventDefault();
            this.#count += $evEl0 + event + $evRoot0;
            this.render();
          }}
          onfocus={() => {
            this.#count = 10;
            this.render();
          }}
        >
          Add five
        </button>
        <button id="assignment" onclick={(this.#count += 1)}>
          Add one
        </button>
        <button id="reset" onclosed={this.#reset}>
          Reset
        </button>
        <table>
          <tr>
            <td>
              <button id="table" data-step="1" onclick={this.#increment}>
                Increment
              </button>
            </td>
          </tr>
        </table>
      </section>
    );
  }
}

customElements.define('wcc-private-counter', PrivateCounter);
