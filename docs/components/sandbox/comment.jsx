export default class CommentComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const author = this.getAttribute('author') ?? 'Anonymous';
    const content = this.getAttribute('content') ?? '';

    return (
      <div>
        <article>
          <h3>{author}</h3>
          <div innerHTML={content}></div>
        </article>
      </div>
    );
  }
}

customElements.define('sb-comment-jsx', CommentComponent);
