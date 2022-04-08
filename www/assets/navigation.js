// intentionally nested in the assets/ directory to test wcc nested dependency resolution logic
const template = document.createElement('template');

template.innerHTML = `
  <style>
    ul {
      list-style-type: none;
      color: #efefef;
    }

    ul li {
      float: left;
      width: 150px;
    }

    ul li a:visited {
      color: #efefef;
    }
  </style>

  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/artists">Artists</a></li>
    <ul>
  </nav>
`;

class Navigation extends HTMLElement {
  constructor() {
    super();

    if(this.shadowRoot) {
      console.debug('Navigation => shadowRoot detected!')
    } else {
      this.attachShadow({ mode: 'open' });
    }
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('wcc-navigation', Navigation);