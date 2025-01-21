import './components/module-importer-1.js';
import './components/module-importer-2.js';

export default class DuplicateImportedModule extends HTMLElement {

  connectedCallback() {
    this.innerHTML = '<module-importer-1></module-importer-1><module-importer-2></module-importer-2>';
  }
}

customElements.define('duplicate-imported-module', DuplicateImportedModule);