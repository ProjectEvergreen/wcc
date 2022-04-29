import './components/footer.js';
import './components/header.js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    * {
      margin: 0;
      padding: 0;
      color: red;
    }
  </style>

  <main>
    <section>
      <wcc-header></wcc-header>
    </section>

    <section>
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