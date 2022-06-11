import './components/footer.js';
import './components/header.js';

class Layout extends HTMLElement {
  connectedCallback() {
    this.innerHTML = this.render();
  }

  render() {
    return `
      <style>
        :root {
          --accent: #367588;
        }

        body {
          display: flex;
          flex-direction: column;
        }

        main {
          max-width: 1200px;
          margin: 20px auto;
          width: 100%;
          padding: 0 1rem;
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
    `;
  }
}

export default Layout;