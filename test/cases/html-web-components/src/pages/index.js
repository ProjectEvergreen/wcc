import '../components/picture-frame.js';

export default class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <wcc-picture-frame title="Greenwood">
        <img
          src="https://www.greenwoodjs.io/assets/greenwood-logo-og.png"
          alt="Greenwood logo"
        />
        <br/>
        <span>Author: <span>WCC</span></span>
      </wcc-picture-frame>
    `;
  }
}