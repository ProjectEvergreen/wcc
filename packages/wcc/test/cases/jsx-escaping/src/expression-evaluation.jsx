export default class ExpressionEvaluation extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    let reads = 0;
    const readText = () => `Value ${++reads}`;
    const values = {
      get label() {
        return readText();
      },
    };

    return (
      <section title={readText()} data-reads={++reads}>
        <p>{readText()}</p>
        <p>{values.label}</p>
      </section>
    );
  }
}

customElements.define('wcc-expression-evaluation', ExpressionEvaluation);
