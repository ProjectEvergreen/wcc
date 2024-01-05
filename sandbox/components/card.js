export default class Card extends HTMLElement {

  selectItem() {
    alert(`selected item is => ${this.getAttribute('title')}!`);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const thumbnail = this.getAttribute('thumbnail');
      const title = this.getAttribute('title');
      const template = document.createElement('template');

      template.innerHTML = `
        <style>
          :host .card {
            width: 30%;
            margin: 0 auto;
          }

          :host button {
            margin: 0 auto;
            display: block;
          }
        </style>
        <div class="card">
          <h3>${title}</h3>
          <img src="${thumbnail}" alt="${title}" loading="lazy" width="100%">
          <button onclick="this.getRootNode().host.selectItem()">View Item Details</button>
        </div>
      `;
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    } else {
      console.log('SUCCESS, shadowRoot detected for card.js!');
    }
  }
}

customElements.define('sb-card', Card);