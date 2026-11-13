export default class EmptyFragments extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return <></>;
  }
}

customElements.define('wcc-empty-fragments', EmptyFragments);
