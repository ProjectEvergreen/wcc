import fetch from 'node-fetch';

class EventsList extends HTMLElement {
  async connectedCallback() {
    if (!this.shadowRoot) {
      const events = await fetch('http://www.analogstudios.net/api/v2/events').then(resp => resp.json());

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<h1>Events List (${events.length})</h1>`;
    }
  }
}

export {
  EventsList
};

customElements.define('wc-events-list', EventsList);