/*
 * Use Case
 * Compile literal `this` reads, destructured aliases, and derived render locals.
 *
 * User Result
 * HTML preserves instance expressions; effects resolve signals in instance scope.
 * Only public State fields become observed attributes.
 *
 * User Workspace
 * src/
 *   this-references.jsx
 */
import { expect } from 'chai';
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { renderToString } from 'wc-compiler';

const compact = (source) => source.replace(/\s+/g, '');
const readFixture = async (name) =>
  compact(await fs.readFile(new URL(`./fixtures/${name}.txt`, import.meta.url), 'utf8'));

describe('JSX literal and derivative this references', () => {
  let content;
  let source;

  before(async () => {
    const { html, metadata } = await renderToString(
      new URL('./src/this-references.jsx', import.meta.url),
    );
    content = new JSDOM(html).window.document.querySelector('template').content;
    source = compact(metadata['wcc-this-references'].source);
  });

  // <h2 title={this.todos.length}>You have {this.todos.length} TODOs left</h2>
  // <p data-count={this.count.get()}>The count is {this.count.get()}</p>
  it('renders literal this expressions and signal values in Shadow DOM', () => {
    expect(content.querySelector('h2').textContent).to.equal('You have 2 TODOs left');
    expect(content.querySelector('h2').getAttribute('title')).to.equal('2');
    expect(content.querySelector('section > p').textContent).to.equal('The count is 2');
    expect(content.querySelector('section > p').getAttribute('data-count')).to.equal('2');
    expect(content.querySelector('span').className).to.equal('even');
    expect(content.querySelector('span').textContent).to.equal('even');
  });

  // const { count: total, user, predicate } = this;
  // const conditionClass = predicate ? 'met' : 'unmet';
  it('renders destructured and derived values', () => {
    expect(content.querySelector('h3').textContent.trim()).to.equal('Alex');
    expect(content.querySelector('h3').className).to.equal('met');
    expect(content.querySelector('h3').getAttribute('title')).to.equal('Alex: met');
    expect(content.querySelector('section > p:nth-of-type(2)').textContent).to.equal('Total: 2');
    expect(content.querySelector('section > p:nth-of-type(2)').getAttribute('data-count')).to.equal(
      '2',
    );
    expect(content.querySelector('span:nth-of-type(2)').textContent).to.equal('Current: 2');
    expect(content.querySelector('span:nth-of-type(2)').getAttribute('title')).to.equal('2');
  });

  // <p data-count={total.get()}>Total: {total.get()}</p>
  // <span title={current.get()}>Current: {current.get()}</span>
  it('emits direct and aliased effects against the original instance fields and Shadow DOM targets', async () => {
    expect(source).to.contain(await readFixture('effects'));
    expect(source).not.to.contain('__this__');
    expect(source).not.to.contain('this.current.get()');
    expect(source).not.to.contain('this.conditionClass.get()');
    expect(source).not.to.contain('this.todos.get()');
  });

  // this.count = new Signal.State(2);
  // this.parity = new Signal.Computed(() => (this.count.get() % 2 ? 'odd' : 'even'));
  it('generates static templates and observes only the public State, excluding Computeds and derived locals', async () => {
    expect(source).to.contain(await readFixture('reactive-members'));
  });

  // <button onclick={() => this.deleteUser(user.id)}>Delete {user.name}</button>
  it('keeps destructured locals in the compiled event callback scope', async () => {
    expect(source).to.contain('const{count:total,user,predicate}=this;');
    expect(source).to.contain(await readFixture('listeners'));
  });

  // <p title={this.total.get()}>Tasks: {this.total.get()}</p>
  it('renders a root-level Computed read alongside the aliased State', () => {
    const paragraph = content.querySelector('section + p');
    expect(paragraph.textContent).to.equal('Tasks: 2');
    expect(paragraph.getAttribute('title')).to.equal('2');
  });
});
