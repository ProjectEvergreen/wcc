import './imported-module.js';

export default class ModuleImporter2 extends HTMLElement {

  connectedCallback() {
    this.innerHTML = '<imported-module></imported-module>';
  }
}

customElements.define('module-importer-2', ModuleImporter2);