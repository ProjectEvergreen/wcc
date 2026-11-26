export default class LineBreaks extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const saved = <br />;
    const breaks = [<br />, <br />];

    return (
      <main>
        {/* prettier-ignore */}
        <p id="single">One<br />Two</p>
        {/* prettier-ignore */}
        <p id="multiple">One<br /><br />Two</p>
        <p id="saved">One{saved}Two</p>
        <p id="array">One{breaks}Two</p>
      </main>
    );
  }
}

customElements.define('wcc-line-breaks', LineBreaks);
