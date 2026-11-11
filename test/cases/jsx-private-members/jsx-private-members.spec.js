import { expect } from 'chai';
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { renderToString } from 'wc-compiler';

const compact = (source) => source.replace(/\s+/g, '');

describe('JSX private members and event listeners', () => {
  let counter;
  let heading;
  let signals;

  before(async () => {
    counter = await renderToString(new URL('./src/counter.jsx', import.meta.url));
    heading = await renderToString(new URL('./src/heading.tsx', import.meta.url));
    signals = await renderToString(new URL('./src/signals-counter.jsx', import.meta.url));
  });

  it('should render private fields, accessors, and instance and static method calls with escaping', () => {
    const source = counter.metadata['wcc-private-counter'].source;
    const document = new JSDOM(counter.html).window.document;

    expect(document.querySelector('section').getAttribute('title')).to.equal(
      'Private <counter> & "label"',
    );
    expect(document.querySelector('p').textContent).to.equal('Count: 0');
    expect(document.querySelectorAll('p')[1].textContent).to.equal('Value: 0');
    expect(document.querySelector('#title').textContent).to.equal('Private <counter> & "label"');

    expect(source).to.contain('${this.#getTitle()}');
    expect(source).to.contain('${PrivateCounter.#format(this.#count)}');
  });

  it('should emit class-scoped listeners after mounting, preserving private and local references', async () => {
    const source = counter.metadata['wcc-private-counter'].source;
    const expected = await fs.readFile(
      new URL('./fixtures/counter/listeners.txt', import.meta.url),
      'utf8',
    );

    expect(compact(source)).to.contain(compact(expected));
    expect(source.indexOf('this.innerHTML =')).to.be.lessThan(
      source.indexOf("this.querySelector('section"),
    );
    expect(source.match(/this\.querySelector\('section:nth-of-type\(1\)'\)/g)).to.have.length(1);
  });

  it('should compile typed private handlers against the shadow root after mounting', () => {
    const source = heading.metadata['wcc-private-heading'].source;
    const document = new JSDOM(heading.html).window.document;

    expect(compact(source)).to.contain(
      compact(`
      const $evRoot0 = this.shadowRoot.querySelector('h1:nth-of-type(1)');
      const $evEl0 = $evRoot0;
      $evEl0?.addEventListener('click', event => this.#sayHello(event));
    `),
    );
    expect(source.indexOf('this.shadowRoot.innerHTML =')).to.be.lessThan(
      source.indexOf('const $evRoot0 ='),
    );

    expect(
      document.querySelector('template').content.querySelector('h1').textContent.trim(),
    ).to.equal('Hello');
  });

  it('should reuse populated Shadow DOM for initial listener setup and mount content on later renders', async () => {
    const source = heading.metadata['wcc-private-heading'].source;
    const expected = await fs.readFile(
      new URL('./fixtures/heading/render.txt', import.meta.url),
      'utf8',
    );

    expect(compact(source)).to.contain('#evInitialized=false;');
    expect(compact(source)).to.contain(compact(expected));
  });

  it('should generate effects for private signal reads and aliases', async () => {
    const source = signals.metadata['wcc-private-signals'].source;
    const document = new JSDOM(signals.html).window.document;
    const expected = await fs.readFile(
      new URL('./fixtures/signals-counter/effects.txt', import.meta.url),
      'utf8',
    );

    expect(compact(source)).to.contain(compact(expected));
    expect(compact(source)).to.contain('staticgetobservedAttributes(){return[];}');
    expect(compact(source)).to.contain(
      'disconnectedCallback(){this.$eff0();this.$eff1();this.$eff2();this.$eff3();this.$eff4();this.$eff5();}',
    );
    expect(source).to.contain('PrivateSignals.$$tmpl2(this.count.get())');

    expect(document.querySelector('span').textContent).to.equal('Alias: 0');
    expect(document.querySelector('p').textContent).to.equal('Direct: 0');
    expect(document.querySelector('section').getAttribute('title')).to.equal('even');
  });

  it('should infer effects for direct private signal reads', () => {
    const source = heading.metadata['wcc-private-heading'].source;

    expect(source).to.contain('PrivateHeading.$$tmpl0(this.#greeting.get())');
    expect(source).to.contain("this.$el0.setAttribute('title', this.#greeting.get())");
    expect(compact(source)).to.contain('staticgetobservedAttributes(){return[];}');
  });
});
