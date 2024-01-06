// JSX does not support inline style tags
// https://stackoverflow.com/questions/27530462/tag-error-react-jsx-style-tag-error-on-render
const styles = `
  :host .card {
    width: 30%;
    margin: 0 auto;
  }

  :host h3 {
    text-align: center;
  }

  :host button {
    margin: 0 auto;
    display: block;
  }
`;

export default class CardJsx extends HTMLElement {

  selectItem() {
    alert(`selected item is => ${this.title}!`);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      console.warn('NO shadowRoot detected for card.jsx!');
      this.thumbnail = this.getAttribute('thumbnail');
      this.title = this.getAttribute('title');

      this.attachShadow({ mode: 'open' });
      this.render();
    } else {
      console.log('SUCCESS, shadowRoot detected for card.jsx!');
    }
  }

  render() {
    const { thumbnail, title } = this;

    return (
      <div class="card">
        <style>
          {styles}
        </style>
        <h3>{title}</h3>
        <img src={thumbnail} alt={title} loading="lazy" width="100%"/>
        <button onclick={this.selectItem}>View Item Details</button>
      </div>
    );
  }
}

customElements.define('sb-card-jsx', CardJsx);