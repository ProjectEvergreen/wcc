export default class UnserializableSSRComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open', serializable: false });
      const template = document.createElement('template');
      template.innerHTML = `
        <h2>Unserializable Component with serializableShadowRoots</h2>
      `;
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      this.shadowRoot.innerHTML = this.getHTML({ serializableShadowRoots: true });
    }
  }
}

customElements.define('unserializable-ssr-component', UnserializableSSRComponent);