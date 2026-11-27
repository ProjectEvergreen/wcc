export default class DocumentFragmentComponent extends HTMLElement {
  connectedCallback() {
    const fragment1 = document.createDocumentFragment();
    const fragment2 = new DocumentFragment();

    const h1 = document.createElement('h2');
    h1.textContent = 'document.createDocumentFragment()';
    fragment1.appendChild(h1);

    const h2 = document.createElement('h2');
    h2.textContent = 'new DocumentFragment()';
    fragment2.appendChild(h2);

    this.appendChild(fragment1);
    this.appendChild(fragment2);
  }
}

customElements.define('document-fragment-component', DocumentFragmentComponent);
