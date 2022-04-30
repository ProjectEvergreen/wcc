const template = document.createElement('template');

template.innerHTML = `
  <style>
    p {
      color: white;
      background-color: #666;
      padding: 5px;
    }
  </style>
  <p><slot name="my-text">My default text</slot></p>
`;

class MyParagraph extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export default MyParagraph;

customElements.define('wcc-paragraph', MyParagraph);