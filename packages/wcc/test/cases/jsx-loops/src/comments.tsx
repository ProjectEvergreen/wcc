export const inferredObservability = true;

export default class Comments extends HTMLElement {
  open;
  visibility;
  label;

  constructor() {
    super();
    this.open = new Signal.State(true);
    this.visibility = new Signal.Computed(() =>
      this.open.get() ? 'display: block' : 'display: none',
    );
    this.label = new Signal.Computed(() => (this.open.get() ? 'Hide replies' : 'Show replies'));
  }

  connectedCallback() {
    this.render();
  }

  toggle() {
    this.open.set(!this.open.get());
  }

  render() {
    const { open, visibility, label } = this;
    const replies: Array<{ author: string; text: string }> = [
      { author: 'Alex', text: 'First <reply>' },
      { author: 'Sam', text: 'Second & reply' },
    ];
    return (
      <article>
        <button type="button" aria-expanded={open.get()} onclick={this.toggle}>
          {label.get()}
        </button>
        <ul style={visibility.get()}>
          {replies.map(({ author, text }, index) => (
            <li data-index={index}>
              <h3>{author}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </article>
    );
  }
}

customElements.define('wcc-loop-comments', Comments);
