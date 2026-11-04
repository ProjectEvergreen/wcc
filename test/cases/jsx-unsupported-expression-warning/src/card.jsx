export default class Card extends HTMLElement {
  constructor() {
    super();
    this.items = ['one', 'two', 'three'];
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { items } = this;
    const count = items.length;

    return (
      <div>
        <p id="plus">Plus one: {count + 1}</p>
        <ul id="list">
          {items.map((item) => (
            <li>{item}</li>
          ))}
        </ul>
      </div>
    );
  }
}

customElements.define('wcc-card', Card);
