/* eslint-disable no-constant-binary-expression -- Exercise short-circuit values and skipped branches in JSX. */
type Day = { date: number | null; events: string[] };

const heading = (active: boolean) => (active ? <strong>Helper</strong> : null);

export default class Conditions extends HTMLElement {
  #label = '<selected> & text';

  connectedCallback() {
    this.render();
  }

  render() {
    const active = this.hasAttribute('active');
    const fallback = this.getAttribute('fallback');
    let reads = 0;
    const read = () => ++reads;
    const saved = active ? <em>Saved</em> : '<fallback>';
    const fail = () => {
      throw new Error('An unselected branch was evaluated');
    };

    const week: Day[] = [
      { date: null, events: [] },
      { date: 1, events: [] },
      { date: 2, events: ['Music <live>', 'Art & craft'] },
    ];

    return (
      <section>
        <p id="ternary">{active ? <b>{this.#label}</b> : <i>Inactive</i>}</p>
        <p id="and">{active && <span>Active</span>}</p>
        <p id="or">{active || <span>Fallback</span>}</p>
        <p id="nullish">{fallback ?? <span>Nullish</span>}</p>
        <p id="zero">{0 && <span>Unused</span>}</p>
        <p id="empty">{active ? null : false}</p>
        <p id="saved">
          {saved}
          {heading(active)}
        </p>
        <div id="fragment">
          {active ? (
            <>
              <b>First</b>
              <i>Second</i>
            </>
          ) : null}
        </div>
        <p id="lazy">
          {read() === 1 ? <span>{read()}</span> : fail()}
          {false && fail()}
          {true || fail()}
        </p>
        <p id="reads">{reads}</p>
        {week.map((day) => (
          <div class="day">
            {!day.date ? <span class="empty"></span> : null}
            {day.date && !day.events.length ? day.date : null}
            {day.events.length
              ? day.events.map((event) => (
                  <a href={`/events/${day.date}/`} title={event}>
                    {event}
                  </a>
                ))
              : null}
          </div>
        ))}
      </section>
    );
  }
}

customElements.define('wcc-conditions', Conditions);
