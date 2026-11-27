import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { renderFromHTML } from 'wc-compiler';

const component = new URL('./src/conditions.tsx', import.meta.url);

function expectOutput(source, fixture) {
  const expected = fs.readFileSync(
    new URL(`./fixtures/conditions/${fixture}.txt`, import.meta.url),
    'utf-8',
  );
  expect(source.replace(/\s+/g, '')).to.contain(expected.replace(/\s+/g, ''));
}

describe('JSX conditionals', () => {
  describe('Active condition', () => {
    let document;
    let source;

    before(async () => {
      const { html, metadata } = await renderFromHTML('<wcc-conditions active></wcc-conditions>', [
        component,
      ]);
      document = new JSDOM(html).window.document;
      source = metadata['wcc-conditions'].source;
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

    // {true ? <p>Conditional sibling</p> : null}
    // <p title={this.#value.get()}>{this.#value.get()}</p>
    it('targets the reactive sibling independently of conditional sibling counts', () => {
      const marker = document
        .querySelector('#reactive-sibling')
        .getAttributeNames()
        .find((name) => name.startsWith('data-wcc-target-'));
      expect(marker).to.be.a('string');
      const selector = `[${marker}]`;
      expectOutput(source, 'connected-callback');
      expectOutput(source, 'root-lookup');
      expect(document.querySelector(selector).id).to.equal('reactive-sibling');
      expect(document.querySelector(selector).getAttribute('title')).to.equal('Reactive sibling');
      expect(document.querySelector('#conditional-sibling').textContent).to.equal(
        'Conditional sibling',
      );
      expect(source).not.to.contain('p:nth-of-type');
    });

    // {active ? <><button onclick={() => this.select(user.id)} />
    //             <button onclick={this.#reset} /></> : null}
    // {active && <button onclick={() => this.#select(user.id)} />}
    // {fallback ?? <button onclick={this.#reset} />}
    it('keeps captured locals and private handlers in render-scoped branch callbacks', () => {
      expectOutput(source, 'render');
      expect(document.querySelectorAll('[onclick]')).to.have.length(0);
      const buttons = [
        'captured-handler',
        'private-handler',
        'logical-handler',
        'nullish-handler',
        'static-handler',
      ].map((id) => document.getElementById(id));
      const marker = buttons[0].getAttributeNames().find((name) => name.startsWith('data-wcc-ev-'));
      expect(marker).to.be.a('string');
      expect(buttons.map((button) => button.getAttribute(marker))).to.deep.equal([
        '0',
        '1',
        '2',
        '3',
        '4',
      ]);
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

    // Unselected ternary/&& buttons register nothing; the ?? fallback and static button remain.
    it('registers callbacks only for the selected branches', () => {
      expect(document.getElementById('captured-handler')).to.equal(null);
      expect(document.getElementById('private-handler')).to.equal(null);
      expect(document.getElementById('logical-handler')).to.equal(null);
      const fallback = document.getElementById('nullish-handler');
      const marker = fallback.getAttributeNames().find((name) => name.startsWith('data-wcc-ev-'));
      expect(marker).to.be.a('string');
      expect(fallback.getAttribute(marker)).to.equal('0');
      expect(document.getElementById('static-handler').getAttribute(marker)).to.equal('1');
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

  describe('Unsupported reactive text combinations', () => {
    // <section>{true ? <p>Conditional</p> : null}{this.#value.get()}</section>
    // A parent textContent effect would erase the conditional paragraph.
    it('rejects reactive text sharing its parent with dynamic markup', async () => {
      try {
        await renderFromHTML('<wcc-mixed-conditional-text></wcc-mixed-conditional-text>', [
          new URL('./src/mixed-reactive-text.tsx', import.meta.url),
        ]);
        expect.fail('Expected an unsupported reactive text diagnostic');
      } catch (error) {
        expect(error.message).to.equal(
          'Reactive text cannot share a parent with dynamic JSX. Wrap the signal read in its own element.',
        );
      }
    });
  });
});
