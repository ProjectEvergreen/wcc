class Navigation extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/artists">Artists</a></li>
        <ul>
      </nav>
    `;
  }
}

customElements.define('wcc-navigation', Navigation);

class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="header">>
        <h4>My Personal Blog</h4>
      </header>
    `;
  }
}

export default Header;
