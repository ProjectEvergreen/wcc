export default class Navigation extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  render() {
    return (
      <nav role="menu">
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/docs/">Docs</a>
          </li>
          <li>
            <a href="/examples/">Examples</a>
          </li>
        </ul>
      </nav>
    );
  }
}

customElements.define('wcc-navigation', Navigation);

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wcc-navigation': {};
    }
  }
}
