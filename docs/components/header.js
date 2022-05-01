import './navigation.js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    .header {
      background-color: var(--color-primary);
      min-height: 30px;
      padding: 5px;
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

    .head-wrap > div {
      flex-grow: 1;
      width: 33%;
      min-height: 60px;
    }

    .header .social {
      text-align: right;
      padding: 10px 10px 0 0;
    }

    .header img.github-badge {
      display: inline-block;
      align-items: right;
      width: 90px;
      height: 20px;
    }
  </style>

  <header class="header">
    <div class="head-wrap">
      <div class="brand">
        <a href="/">
          <img src="/www/assets/wcc-logo.jpg" alt="WCC logo"/>
        </a>
      </div>

      <div>
        <wcc-navigation></wcc-navigation>
      </div>

      <div class="social">
        <a href="https://github.com/ProjectEvergreen/wcc">
          <img
            src="https://img.shields.io/github/stars/ProjectEvergreen/wcc.svg?style=social&logo=github&label=github"
            alt="WCC GitHub badge"
            class="github-badge"/>
        </a>
      </div>
    </div>
  </header>
`;

class Header extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export {
  Header
};

customElements.define('wcc-header', Header);