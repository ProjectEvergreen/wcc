import './navigation.js';

const template = document.createElement('template');

template.innerHTML = `
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
          <h4>WCC</h4>
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