import './navigation.js';

class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = this.render();
  }

  render() {
    return `
      <header>
        <div>
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
      </header>
    `;
  }
}

export { Header };

customElements.define('wcc-header', Header);
