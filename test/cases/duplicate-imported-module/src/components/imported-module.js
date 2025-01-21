export default class ImportedModule extends HTMLElement {

  connectedCallback() {
    this.innerHTML = '<h2>Imported Module</h2>';
  }
}

customElements.define('imported-module', ImportedModule);