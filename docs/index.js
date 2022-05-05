import './components/footer.js';
import './components/header.js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :root {
      --color-primary: #367588;
      --color-secondary: #e5e4e2;
    }

    * {
      margin: 0;
      padding: 0;
      background-color: var(--color-secondary);
    }

    #content {
      width: 70%;
      margin: 3% auto;
      padding: 2%;
      border: 1px solid #020202;
      border-radius: 5px;
      filter: drop-shadow(5px 5px 5px #367588);
    }

    p, h1, h2, ul, ol {
      margin: 8px;
      padding: 8px;
    }
  </style>

  <main>
    <section>
      <wcc-header></wcc-header>
    </section>

    <section id="content">
      <slot name="content"></slot>
    </section>

    <section>
      <wcc-footer></wcc-footer>
    </section>

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