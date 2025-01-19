export default class SerializableNonSSRComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open', serializable: true });
      const template = document.createElement('template');
      template.innerHTML = `
        <h2>Serializable Component w/o serializableShadowRoots</h2>
      `;
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      this.shadowRoot.innerHTML = this.getHTML({ serializableShadowRoots: false });
    }
  }
}

customElements.define('serializable-non-ssr-component', SerializableNonSSRComponent);