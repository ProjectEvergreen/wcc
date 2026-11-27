async function getPost(postId) {
  return {
    id: postId,
    title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
    body: 'quia et suscipit',
  };
}

export default class PostPage extends HTMLElement {
  constructor(postId) {
    super();

    this.postId = postId;
  }

  async connectedCallback() {
    const { postId } = this;
    const post = await getPost(postId);
    const { id, title, body } = post;

    this.innerHTML = `
      <h1>Fetched Post ID: ${id}</h1>
      <h2>${title}</h2>
      <p>${body}</p>
    `;
  }
}
