export default class ShadowDomEscapeHelper extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
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

customElements.define('wcc-shadow-dom-escape-helper', ShadowDomEscapeHelper);
