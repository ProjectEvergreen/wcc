export function createChildren(text) {
  return [<strong title={text}>{text}</strong>, `<strong>${text}</strong>`];
}

export default class ValueSource extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return <div>{createChildren('From helper')}</div>;
  }
}

customElements.define('wcc-mixed-value-source', ValueSource);
