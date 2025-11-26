import '../navigation/navigation.tsx';

export default class Header extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  render() {
    return (
      <header>
        <span>WCC</span>
        <wcc-navigation></wcc-navigation>
      </header>
    );
  }
}

customElements.define('wcc-header', Header);
