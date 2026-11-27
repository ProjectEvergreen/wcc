export default class BadgeComponent extends HTMLElement {
  count;
  predicate;

  constructor() {
    super();

    this.count = 0;
    this.predicate = false;
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['count', 'predicate'];
  }

  render() {
    const { count, predicate } = this;
    const conditionalClass = predicate ? 'met' : 'unmet';
    const conditionalText = predicate ? ' 🥳' : '';

    return (
      <span>
        <img src="badge-icon.png" alt="Badge Icon" width={16} height={16} />
        <span class={conditionalClass}>
          {count}
          {conditionalText}
        </span>
      </span>
    );
  }
}

customElements.define('wcc-badge', BadgeComponent);
