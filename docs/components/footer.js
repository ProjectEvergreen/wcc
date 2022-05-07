const template = document.createElement('template');

template.innerHTML = `
  <style>
    footer {
      background-color: var(--accent);
      min-height: 30px;
      padding: 10px 0;
      grid-column: 1 / -1;
      text-align: center;
    }

    footer h4 {
      margin: 0 auto;
    }

    footer a:visited {
      color: var(--text);
      text-decoration: none;
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