export default class Posts extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const posts = [
      { summary: 'Summary <1>' },
      { summary: 'Summary & 2' },
      { summary: 'Summary 3' },
    ];

    return (
      <section>
        <div id="summaries">
          {posts.map((post) => (
            <details class="post__summary">{post.summary}</details>
          ))}
        </div>
        <ul id="blocks">
          {posts.map((post, index) => {
            if (index === 1) return;
            if (index === 2) return '<plain text>';
            return <li>{post.summary}</li>;
          })}
        </ul>
        <p id="plain">{posts.map((post) => post.summary)}</p>
      </section>
    );
  }
}

customElements.define('wcc-loop-posts', Posts);
