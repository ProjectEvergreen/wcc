const $$wccMarkup = 'authored name';
const helper = (text) => <b>{text}</b>;

export default class Lists extends HTMLElement {
  #suffix = '!';

  connectedCallback() {
    this.render();
  }

  action() {}

  render() {
    const items = [
      { name: '<Alex>', show: true },
      { name: 'Sam & Jo', show: true },
    ];
    const saved = items.map(({ name }, index) => {
      const title = `${index}: ${name}${this.#suffix}`;
      return (
        <li title={title}>
          <span>{title}</span>
        </li>
      );
    });
    const collected = [];
    items.forEach(({ name }) => collected.push(<em>{name}</em>));
    return (
      <main>
        <ul id="saved">{saved}</ul>
        <ul id="chain">
          {items
            .filter((item) => item.show)
            .map(({ name }) => (
              <li>{name}</li>
            ))}
        </ul>
        <div id="flat">{items.flatMap(({ name }) => [<span>{name}</span>, <br />])}</div>
        <div id="nested">
          {[1, 2].map((number) => (
            <section>
              {[3, 4].map((value) => (
                <small>{number * value}</small>
              ))}
            </section>
          ))}
        </div>
        <div id="empty">
          {[].map((value) => (
            <p>{value}</p>
          ))}
        </div>
        <div id="foreach">
          {items.forEach(({ name }) => (
            <p>{name}</p>
          ))}
        </div>
        <div id="collected">{collected}</div>
        <div id="helper">{helper('chosen')}</div>
        <div id="collision">{$$wccMarkup}</div>
        <div id="inline">
          {items.map(({ name }) => (
            <button onclick={() => this.action()}>{name}</button>
          ))}
        </div>
        <table>
          <tbody>
            {items.map(({ name }) => (
              <tr>
                <td>
                  <button onclick={this.action}>{name}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div id="json">
          {items.map((item) => (
            <span data-comment={JSON.stringify(item)}></span>
          ))}
        </div>
      </main>
    );
  }
}

customElements.define('wcc-loop-lists', Lists);
