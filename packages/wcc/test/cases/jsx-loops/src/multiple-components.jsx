export default class First extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <ul>
        {['first'].map((text) => (
          <li>{text}</li>
        ))}
      </ul>
    );
  }
}

class Second extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <ul>
        {['second'].map((text) => (
          <li>{text}</li>
        ))}
      </ul>
    );
  }
}

customElements.define('wcc-loop-first', First);
customElements.define('wcc-loop-second', Second);
