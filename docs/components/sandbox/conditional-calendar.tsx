type Day = { date: number | null; events: string[] };

export default class ConditionalCalendar extends HTMLElement {
  #showEvents = true;

  connectedCallback() {
    this.render();
  }

  #toggleEvents() {
    this.#showEvents = !this.#showEvents;
    this.render();
  }

  render() {
    const week: Day[] = [
      { date: null, events: [] },
      { date: 1, events: [] },
      { date: 2, events: ['Live music', 'Art & craft'] },
    ];

    return (
      <section style="text-align: center;">
        <button type="button" aria-expanded={this.#showEvents} onclick={this.#toggleEvents}>
          {this.#showEvents ? 'Hide events' : 'Show events'}
        </button>
        {week.map((day) => (
          <div>
            <p>{day.date ? `Day ${day.date}` : 'Empty calendar slot'}</p>
            {day.date && !day.events.length ? <p>No events scheduled</p> : null}
            {this.#showEvents && day.events.length > 0
              ? day.events.map((event) => <p>{event}</p>)
              : null}
          </div>
        ))}
      </section>
    );
  }
}

customElements.define('sb-conditional-calendar-tsx', ConditionalCalendar);
