// intentionally nested to test wcc nested dependency resolution logic
import '../assets/navigation.js';

class Header extends HTMLElement {
  constructor() {
    super();

    console.debug('HEADER constructor + SHADOW ROOT', this.shadowRoot);

    if (this.shadowRoot) {
      console.debug('Header => shadowRoot detected!');
      const button = this.shadowRoot.querySelector('button');

      button.addEventListener('click', this.toggle);
    }

    console.debug('=====================');
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      console.debug('Header => shadowRoot NOT detected');
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = this.render();
    }
  }

  toggle() {
    alert('this.toggle clicked!');
  }

  render() {
    return `
      <style>
        .header {
          background-color: #192a27;
          min-height: 30px;
          padding: 10px;
          font-size: 1.2rem;
        }

        .header h4 {
          margin: 0 auto;
          padding: 4px 0 0 10px;
          display: inline-block;
          color: #efefef;
        }

        .head-wrap {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .brand {
          justify-items: left;
          padding: 10px;
        }

        .brand img {
          float:left;
          height: 30px;
          width: 30px;
        }

        .header .social {
          margin-left:auto;
          text-align: right;
        }

        .header img.github-badge {
          display: inline-block;
          width: 90px;
          height: 20px;
        }

        button {
          cursor: pointer;
        }
      </style>

      <header class="header">
        <div class="head-wrap">
          <div class="brand">
            <a href="/">
              <img src="/www/assets/greenwood-logo.jpg" alt="Greenwood logo"/>
              <h4>My Personal Blog</h4>
            </a>
            <button>Button To Click</button>
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
  }
}

export {
  Header
};

customElements.define('wcc-header', Header);