export default class UnserializableNonSSRComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open', serializable: false });
      const template = document.createElement('template');
      template.innerHTML = `
        <h2>Unserializable Component w/o serializableShadowRoots</h2>
      `;
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      this.shadowRoot.innerHTML = this.getHTML({ serializableShadowRoots: false });
    }
  }
}

customElements.define('unserializable-non-ssr-component', UnserializableNonSSRComponent);
