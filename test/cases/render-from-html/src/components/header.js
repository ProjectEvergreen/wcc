import './navigation.js';

const template = document.createElement('template');

class Header extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title');

    if (!this.shadowRoot) {
      template.innerHTML = `
        <header class="header">
          <div class="head-wrap">
            <div class="brand">
              <a href="/">
                <img src="/www/assets/greenwood-logo.jpg" alt="Greenwood logo"/>
                <h4>${title}</h4>
              </a>
            </div>

            <wcc-navigation></wcc-navigation>

            <div class="social">
              <a href="https://github.com/ProjectEvergreen/greenwood">
                <img
                  src="https://img.shields.io/github/stars/ProjectEvergreen/greenwood.svg?style=social&logo=github&label=github"
                  alt="Greenwood GitHub badge"
                  class="github-badge"/>
              </a>
            </div>
          </div>
        </header>
      `;

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export default Header;

customElements.define('wcc-html-header', Header);
