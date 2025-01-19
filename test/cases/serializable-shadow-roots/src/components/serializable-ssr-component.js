export default class SerializableSSRComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open', serializable: true });
      const template = document.createElement('template');
      template.innerHTML = `
        <h2>Serializable Component with serializableShadowRoots</h2>
      `;
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      this.shadowRoot.innerHTML = this.getHTML({ serializableShadowRoots: true });
    }
  }
}

customElements.define('serializable-ssr-component', SerializableSSRComponent);