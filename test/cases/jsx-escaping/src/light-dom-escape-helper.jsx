export default class LightDomEscapeHelper extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    // Exercise collisions with generated helper and shadow-template names.
    const $$escapeHtml = this.getAttribute('greeting') ?? 'Hello';
    const $$template = this.getAttribute('name') ?? 'World';

    return (
      <section title={$$template}>
        <p>
          {$$escapeHtml} {$$template}
        </p>
      </section>
    );
  }
}

customElements.define('wcc-light-dom-escape-helper', LightDomEscapeHelper);
