// intentionally nested in the assets/ directory to test wcc nested dependency resolution logic
const template = document.createElement('template');

template.innerHTML = `
  <style>
    ul {
      list-style-type: none;
      color: #efefef;
      overflow: auto;
      grid-column: 1 / -1;
    }

    ul li {
      float: left;
      width: 33%;
      text-align: center;
      margin: 10px 0;
    }

    ul li a:visited {
      color: #efefef;
    }
  </style>

  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/docs">Docs</a></li>
      <li><a href="/examples">Examples</a></li>
    <ul>
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