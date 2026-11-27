class EventsList extends HTMLElement {
  async connectedCallback() {
    if (!this.shadowRoot) {
      const events = [{ name: 'Web Components Meetup' }, { name: 'JavaScript Meetup' }];

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<h1>Events List (${events.length})</h1>`;
    }
  }
}

export { EventsList };

customElements.define('wc-events-list', EventsList);
