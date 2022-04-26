const template = document.createElement('template');

template.innerHTML = `
  <style>
    .footer {
      color: white;
      bottom: 0;
      width: 100%;
      background-color: #192a27;
      min-height: 30px;
      padding-top: 10px;
    }
    .footer a {
      color: #efefef;
      text-decoration: none;
    }
    .footer h4 {
      width: 90%;
      margin: 0 auto;
      padding: 0;
      text-align: center;
    }
  </style>

  <footer class="footer">
    <h4>
      <a href="https://www.greenwoodjs.io/">My Blog &copy;${new Date().getFullYear()} &#9672 Built with GreenwoodJS</a>
    </h4>
  </footer>
`;

class Footer extends HTMLElement {
  constructor() {
    super();

    if (this.shadowRoot) {
      console.debug('Footer => shadowRoot detected!');
    }
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export default Footer;

customElements.define('wcc-footer', Footer);