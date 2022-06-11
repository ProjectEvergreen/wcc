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

export {
  Navigation
};

customElements.define('wcc-navigation', Navigation);