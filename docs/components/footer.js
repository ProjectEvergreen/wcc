const template = document.createElement('template');

template.innerHTML = `
  <style>
    footer {
      bottom: 0;
      width: 100%;
      background-color: var(--accent);
      min-height: 30px;
      padding-top: 10px;
      grid-column: 1 / -1;
    }

    footer a {
      color: #efefef;
      text-decoration: none;
    }

    footer h4 {
      width: 90%;
      margin: 0 auto;
      padding: 0;
      text-align: center;
    }
  </style>

  <footer>
    <h4>
      <a href="https://projectevergreen.github.io">WCC &#9672 Project Evergreen</a>
    </h4>
  </footer>
`;

class Footer extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export {
  Footer
};

customElements.define('wcc-footer', Footer);