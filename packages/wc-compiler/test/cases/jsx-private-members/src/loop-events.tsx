export default class PrivateLoopEvents extends HTMLElement {
  #items = [
    { id: 'first', label: 'First' },
    { id: 'second', label: 'Second' },
  ];

  #select(id: string, event: Event) {
    this.setAttribute('selected', id);
    this.setAttribute('last-event', event.type);
  }

  #focus(event: Event) {
    this.setAttribute('focused', (event.currentTarget as HTMLElement).textContent.trim());
  }

  action(event: Event) {
    this.#select('helper', event);
  }

  #renderHelper() {
    return <button onclick={this.action}>Helper</button>;
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    const prefix = 'item';
    const empty: Array<{ id: string }> = [];
    return (
      <div>
        <ul id="items">
          {this.#items.map((item, index) => {
            const id = `${prefix}:${index}:${item.id}`;
            return (
              <li>
                <button onclick={(event: Event) => this.#select(id, event)} onfocus={this.#focus}>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div id="flat">
          {this.#items.flatMap((item) => [
            <button onclick={(event: Event) => this.#select(item.id, event)}>{item.label}</button>,
            <span>{item.id}</span>,
          ])}
        </div>
        <div id="nested">
          {this.#items.map((item) => (
            <section>
              {[1, 2].map((position) => {
                const id = `${item.id}:${position}`;
                return <button onclick={(event: Event) => this.#select(id, event)}>{id}</button>;
              })}
            </section>
          ))}
        </div>
        <div id="empty">
          {empty.map((item) => (
            <button onclick={(event: Event) => this.#select(item.id, event)}>Empty</button>
          ))}
        </div>
        <div id="helper">{this.#renderHelper()}</div>
      </div>
    );
  }
}

customElements.define('wcc-private-loop-events', PrivateLoopEvents);
