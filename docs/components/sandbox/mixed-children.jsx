export default class MixedChildren extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const children = [
      <strong>Rendered as HTML</strong>,
      ' | ',
      '<strong>Displayed as text</strong>',
    ];

    return <p>{children}</p>;
  }
}

customElements.define('sb-mixed-children-jsx', MixedChildren);
