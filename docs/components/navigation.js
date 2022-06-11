class Navigation extends HTMLElement {
  connectedCallback() {
    this.innerHTML = this.render();
  }

  render() {
    return `
      <style>
        nav ul {
          list-style-type: none;
          overflow: auto;
          grid-column: 1 / -1;
          width: 90%;
        }

        nav ul li {
          float: left;
          width: 33.3%;
          text-align: center;
        }

        nav ul li a, nav ul li a:visited {
          display: inline-block;
          color: #efefef;
          min-height: 48px;
          font-size: 2.5rem;
        }
      </style>

      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/docs">Docs</a></li>
          <li><a href="/examples">Examples</a></li>
        </ul>
      </nav>
    `
  }
}

export {
  Navigation
};

customElements.define('wcc-navigation', Navigation);