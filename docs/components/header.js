import './navigation.js';

class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = this.render();
  }

  render() {
    return `
      <style>
        header {
          background-color: var(--accent);
          grid-column: 1 / -1;
          min-height: 150px;
        }

        header .social {
          text-align: right;
          padding: 10px 10px 0 0;
        }

        header .social img{
          margin-top: 1%;
        }

        header .logo {
          width: 15%;
          filter: drop-shadow(0 0 0.75rem white);
        }

        header img.github-badge {
          float: right;
          display: inline-block;
          padding: 10px;
          align-items: top;
        }

        header div.container {
          max-width: 1200px;
          margin: auto;
        }
      </style>

      <header>
        <div class="container">
          <div>
            <a href="/">
              <img src="/assets/wcc-logo.png" alt="WCC logo" class="logo"/>
            </a>

            <a href="https://github.com/ProjectEvergreen/wcc" class="social">
              <img
                src="https://img.shields.io/github/stars/ProjectEvergreen/wcc.svg?style=social&logo=github&label=github"
                alt="WCC GitHub badge"
                width="135px"
                class="github-badge"
              />
            </a>
          </div>

          <wcc-navigation></wcc-navigation>
        </div>
      </header>
    `;
  }
}

export {
  Header
};

customElements.define('wcc-header', Header);
