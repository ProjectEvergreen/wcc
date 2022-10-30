import css from './banner.css';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    ${css}
  </style>

  <h4>
    <a href="https://www.greenwoodjs.io/">My Blog &copy;${new Date().getFullYear()} &#9672 Built with GreenwoodJS</a>
  </h4>
`;

class Banner extends HTMLElement {
  constructor() {
    super();

    if (this.shadowRoot) {
      console.debug('Banner => shadowRoot detected!');
    }
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export default Banner;

customElements.define('wcc-banner', Banner);