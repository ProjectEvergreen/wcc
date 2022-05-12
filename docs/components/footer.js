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

    footer p {
      margin: 0 auto;
      font-weight: bold;
    }

    footer a, footer a:visited {
      color: #efefef;
      text-decoration: none;
    }
  </style>

  <footer>
    <p>
      <a href="https://projectevergreen.github.io">WCC &#9672 Project Evergreen</a>
    </p>
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