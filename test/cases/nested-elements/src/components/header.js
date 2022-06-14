// intentionally nested to test wcc nested dependency resolution logic
import '../assets/navigation.js';

class Header extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = this.render();
    }
  }

  render() {
    return `
      <template shadowroot="open">
        <header class="header">
          <div class="head-wrap">
            <div class="brand">
              <a href="/">
                <img src="/www/assets/greenwood-logo.jpg" alt="Greenwood logo"/>
                <h4>My Personal Blog</h4>
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
      </template>
    `;
  }
}

export {
  Header
};

customElements.define('wcc-header', Header);