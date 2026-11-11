export const inferredObservability = true;

export default class CommentThread extends HTMLElement {
  open;
  label;
  visibility;

  constructor() {
    super();
    this.open = new Signal.State(true);
    this.label = new Signal.Computed(() => (this.open.get() ? 'Hide replies' : 'Show replies'));
    this.visibility = new Signal.Computed(() =>
      this.open.get() ? 'display: block' : 'display: none',
    );
  }

  connectedCallback() {
    this.render();
  }

  toggle() {
    this.open.set(!this.open.get());
  }

  render() {
    const { open, label, visibility } = this;
    const replies = [
      { author: 'Alex', text: 'Can JSX render a list of comments?' },
      { author: 'Sam', text: 'Yes! Text such as <template> & symbols stays escaped.' },
    ];

    return (
      <article>
        <button type="button" aria-expanded={open.get()} onclick={this.toggle}>
          {label.get()}
        </button>
        <ul style={visibility.get()}>
          {replies.map(({ author, text }) => (
            <li>
              <article>
                <h4>{author}</h4>
                <p>{text}</p>
              </article>
            </li>
          ))}
        </ul>
      </article>
    );
  }
}

customElements.define('sb-comment-thread-jsx', CommentThread);
