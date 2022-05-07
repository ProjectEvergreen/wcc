import './components/footer.js';
import './components/header.js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :root {
      --accent: #367588;
    }

    main {
      margin-bottom: 20px;
    }

    a:visited {
      color: var(--accent);
    }
  </style>

  <wcc-header></wcc-header>

  <main>
    <slot name="content"></slot>
  </main>

  <wcc-footer></wcc-footer>

  </main>
`;

class Home extends HTMLElement {

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export default Home;