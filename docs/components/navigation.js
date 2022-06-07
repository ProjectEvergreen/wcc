// intentionally nested in the assets/ directory to test wcc nested dependency resolution logic
const template = document.createElement('template');

template.innerHTML = `
  <style>
    nav ul {
      list-style-type: none;
      overflow: auto;
      grid-column: 1 / -1;
    }

    nav ul li {
      float: left;
      width: 33.3%;
      text-align: center;
    }

    nav ul li a, nav ul li a:visited {
      display: inline-block;
      color: #efefef;
      min-width: 48px;
      min-height: 48px;
      font-size: 2.5rem;
    }
  </style>

  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/docs">Docs</a></li>
      <li><a href="/examples">Examples</a></li>
    </ul>
  </nav>
`;

class Navigation extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export {
  Navigation
};

customElements.define('wcc-navigation', Navigation);