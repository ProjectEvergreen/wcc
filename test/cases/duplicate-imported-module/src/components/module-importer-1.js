import './imported-module.js';

export default class ModuleImporter1 extends HTMLElement {

  connectedCallback() {
    this.innerHTML = '<imported-module></imported-module>';
  }
}

customElements.define('module-importer-1', ModuleImporter1);