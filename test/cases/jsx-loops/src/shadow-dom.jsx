export default class ShadowList extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  action() {}

  render() {
    return (
      <ul>
        {[1, 2].map((value) => (
          <li>
            <button onclick={this.action}>{value}</button>
          </li>
        ))}
      </ul>
    );
  }
}

customElements.define('wcc-loop-shadow', ShadowList);
