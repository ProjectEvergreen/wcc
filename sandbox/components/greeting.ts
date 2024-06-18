interface User {
  name: string;
}

export default class Greeting extends HTMLElement {
  connectedCallback() {
    const user: User = {
      name: this.getAttribute('name') || 'World'
    };

    this.innerHTML = `
      <h3 style="text-align: center">Hello ${user.name}! 👋</h3>
    `;
  }
}

customElements.define('sb-greeting-ts', Greeting);