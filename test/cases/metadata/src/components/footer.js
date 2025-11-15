const template = document.createElement('template');

template.innerHTML = `
  <footer class="footer">
    <h4>
      <a href="https://www.greenwoodjs.io/">My Blog &copy;${new Date().getFullYear()} &#9672 Built with GreenwoodJS</a>
    </h4>
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

export default Footer;

customElements.define('wcc-footer', Footer);
