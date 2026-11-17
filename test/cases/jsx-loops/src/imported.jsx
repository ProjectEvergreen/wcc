import { createChildren } from './values.jsx';

export default class ImportedChildren extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return <div>{createChildren('From another module')}</div>;
  }
}

customElements.define('wcc-imported-mixed-children', ImportedChildren);
