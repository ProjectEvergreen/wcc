export default class FragmentLoops extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  select(id: number) {
    this.setAttribute('selected', String(id));
  }

  render() {
    return (
      <>
        {[1, 2].map((id) => (
          <>
            <button onclick={() => this.select(id)}>Item {id}</button>
            <span>{id}</span>
          </>
        ))}
      </>
    );
  }
}

customElements.define('wcc-fragment-loops', FragmentLoops);
