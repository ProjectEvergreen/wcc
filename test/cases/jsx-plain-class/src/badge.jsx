// a plain helper class (no `extends`), common in real code
class Formatter {
  static label(value) {
    return `#${value}`;
  }
}

export default class Badge extends HTMLElement {
  constructor() {
    super();
    this.value = 42;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { value } = this;

    return <span class="badge">{value}</span>;
  }
}

customElements.define('wcc-badge', Badge);
