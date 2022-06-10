const template = document.createElement('template');

template.innerHTML = `
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/artists">Artists</a></li>
    <ul>
  </nav>
`;

class Navigation extends HTMLElement {
  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));
  }
}

export {
  Navigation
};

customElements.define('wcc-navigation', Navigation);