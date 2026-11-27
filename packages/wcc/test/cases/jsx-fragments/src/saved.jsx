export default class SavedFragments extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const value = '<text>';
    const saved = (
      <>
        <span>Saved</span>
        <span>{value}</span>
      </>
    );
    return <>{saved}</>;
  }
}

customElements.define('wcc-saved-fragments', SavedFragments);
