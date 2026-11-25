import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderFromHTML } from 'wc-compiler';

const component = new URL('./src/conditions.tsx', import.meta.url);

describe('JSX conditionals', () => {
  describe('Active condition', () => {
    let document;

    before(async () => {
      const { html } = await renderFromHTML('<wcc-conditions active></wcc-conditions>', [
        component,
      ]);
      document = new JSDOM(html).window.document;
    });

    // active = true:
    // {active ? <b>{this.#label}</b> : <i>Inactive</i>}
    // {active && <span>Active</span>} {active || <span>Fallback</span>}
    it('renders the consequent and short-circuit children', () => {
      expect(document.querySelector('#ternary > b').textContent).to.equal('<selected> & text');
      expect(document.querySelector('#ternary selected')).to.equal(null);
      expect(document.querySelector('#and > span').textContent).to.equal('Active');
      expect(document.querySelector('#or').textContent).to.equal('');
    });

    // const saved = active ? <em>Saved</em> : '<fallback>';
    // const heading = active => active ? <strong>Helper</strong> : null;
    // {saved} {heading(active)} {active ? <><b>First</b><i>Second</i></> : null}
    it('preserves JSX saved in variables, returned by helpers and grouped in fragments', () => {
      expect(document.querySelector('#saved > em').textContent).to.equal('Saved');
      expect(document.querySelector('#saved > strong').textContent).to.equal('Helper');
      expect(
        [...document.querySelector('#fragment').children].map((child) => child.textContent),
      ).to.deep.equal(['First', 'Second']);
    });

    // const fallback = this.getAttribute('fallback');
    // {fallback ?? <span>Nullish</span>} {0 && <span>Unused</span>} {active ? null : false}
    it('renders nullish fallbacks and zero while omitting empty conditional results', () => {
      expect(document.querySelector('#nullish > span').textContent).to.equal('Nullish');
      expect(document.querySelector('#zero').textContent).to.equal('0');
      expect(document.querySelector('#empty').textContent).to.equal('');
    });

    // let reads = 0; const read = () => ++reads;
    // {read() === 1 ? <span>{read()}</span> : fail()} {false && fail()} {true || fail()}
    it('evaluates the selected branch once and skips unselected expressions', () => {
      expect(document.querySelector('#lazy').textContent.trim()).to.equal('2');
      expect(document.querySelector('#reads').textContent).to.equal('2');
    });
  });

  describe('Inactive condition', () => {
    let document;

    before(async () => {
      const { html } = await renderFromHTML('<wcc-conditions></wcc-conditions>', [component]);
      document = new JSDOM(html).window.document;
    });

    // active = false:
    // {active ? <b>{this.#label}</b> : <i>Inactive</i>}
    // {active && <span>Active</span>} {active || <span>Fallback</span>}
    // {active ? <><b>First</b><i>Second</i></> : null} {active ? null : false}
    it('renders the alternate and logical fallback while omitting unselected JSX', () => {
      expect(document.querySelector('#ternary > i').textContent).to.equal('Inactive');
      expect(document.querySelector('#and').textContent).to.equal('');
      expect(document.querySelector('#or > span').textContent).to.equal('Fallback');
      expect(document.querySelector('#fragment').children).to.have.length(0);
      expect(document.querySelector('#empty').textContent).to.equal('');
    });

    // const saved = active ? <em>Saved</em> : '<fallback>';
    // const heading = active => active ? <strong>Helper</strong> : null;
    // {saved} {heading(active)} // Text fallback, no helper markup when active is false.
    it('escapes an ordinary fallback value and omits the helper result', () => {
      expect(document.querySelector('#saved').textContent.trim()).to.equal('<fallback>');
      expect(document.querySelector('#saved').children).to.have.length(0);
    });
  });

  describe('Conditionals nested with loops', () => {
    // {week.map(day => <div class="day">
    //   {!day.date ? <span class="empty"></span> : null}
    //   {day.date && !day.events.length ? day.date : null}
    //   {day.events.length ? day.events.map(event =>
    //     <a href={`/events/${day.date}/`} title={event}>{event}</a>) : null}
    // </div>)}
    it('renders conditions inside maps and maps inside conditions', async () => {
      const { html } = await renderFromHTML('<wcc-conditions></wcc-conditions>', [component]);
      const document = new JSDOM(html).window.document;
      const days = document.querySelectorAll('.day');

      expect(days).to.have.length(3);
      expect(days[0].querySelector('.empty')).not.to.equal(null);
      expect(days[0].textContent.trim()).to.equal('');
      expect(days[1].textContent.trim()).to.equal('1');
      expect(days[1].children).to.have.length(0);
      expect(
        [...days[2].querySelectorAll('a')].map((link) => [
          link.textContent.trim(),
          link.title,
          link.getAttribute('href'),
        ]),
      ).to.deep.equal([
        ['Music <live>', 'Music <live>', '/events/2/'],
        ['Art & craft', 'Art & craft', '/events/2/'],
      ]);
      expect(days[2].querySelector('live')).to.equal(null);
    });
  });
});
