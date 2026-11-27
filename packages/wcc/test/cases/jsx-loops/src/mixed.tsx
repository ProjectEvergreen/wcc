export default class MixedChildren extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const children: unknown[] = [
      <strong>Rendered as HTML</strong>,
      '<strong>Displayed as text</strong>',
      '&lt;already escaped&gt;',
      0,
      false,
      true,
      null,
      undefined,
    ];
    const saved = children;
    saved.push([<em>Nested JSX</em>, '<em>Nested text</em>']);

    return <div>{saved}</div>;
  }
}

customElements.define('wcc-mixed-children', MixedChildren);
