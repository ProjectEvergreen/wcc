/*
 * Use Case
 * Compile JSX and TSX fragments, including signals and Declarative Shadow DOM.
 *
 * User Result
 * Fragments preserve their children without adding HTML wrappers, DOM depth,
 * or selector levels to the generated HTML and JavaScript.
 */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from 'wc-compiler';
import fs from 'node:fs/promises';

describe('JSX and TSX fragments', function () {
  for (const extension of ['jsx', 'tsx']) {
    describe(extension.toUpperCase(), function () {
      let component;
      let source;

      before(async function () {
        const tag = `wcc-fragments-${extension}`;
        const { html, metadata } = await renderToString(
          new URL(`./src/signals-counter.${extension}`, import.meta.url),
        );

        component = new JSDOM(html).window.document.querySelector(tag);
        source = metadata[tag].source;
      });

      // <>
      //   <div><><button>Increment</button><span>Static sibling</span><span>Count: 0</span></></div>
      //   <p>Value: ...</p>
      //   <button>Increment</button>
      //   <><p>Count: 0</p><></></>
      // </>
      it('should emit root and nested fragment children in order without wrappers', () => {
        expect(Array.from(component.children, (child) => child.tagName)).to.deep.equal([
          'DIV',
          'P',
          'BUTTON',
          'P',
        ]);
        expect(
          Array.from(component.firstElementChild.children, (child) => child.tagName),
        ).to.deep.equal(['BUTTON', 'SPAN', 'SPAN']);
      });

      // const value = '<safe> & sound';
      // <p id="fragment-text"><>Value: <>{value}</></></p>
      it('should preserve and escape text expressions in nested fragments', () => {
        const text = component.querySelector('#fragment-text');

        expect(text.textContent.replace(/\s+/g, ' ').trim()).to.equal('Value: <safe> & sound');
        expect(text.children).to.have.length(0);
        expect(text.innerHTML).to.contain('&lt;safe&gt; &amp; sound');
      });

      // <>
      //   <div><><button onclick={this.increment}>Increment</button></></div>
      //   <button onclick={() => this.increment()}>Increment</button>
      // </>
      it('should emit listeners with selectors that skip fragment boundaries', async () => {
        const expected = await fs.readFile(
          new URL('./fixtures/signals-counter/listeners.txt', import.meta.url),
          'utf8',
        );

        expect(source.replace(/\s+/g, '')).to.contain(expected.replace(/\s+/g, ''));
        expect(source).not.to.contain('$$root(');
        expect(source.indexOf('this.innerHTML =')).to.be.lessThan(
          source.indexOf('const $evRoot0 ='),
        );
      });

      // <>
      //   <div><><button>Increment</button><span>Static sibling</span>
      //     <span data-count={count.get()}>Count: <>{count.get()}</></span>
      //   </></div>
      //   <p>Value: ...</p>
      //   <button>Increment</button>
      //   <><p data-count={count.get()}>Count: <>{count.get()}</></p></>
      // </>
      it('should preserve reactive values and selectors across fragment boundaries', () => {
        for (const id of ['child-reactive', 'root-reactive']) {
          const element = component.querySelector(`#${id}`);

          expect(element.textContent.replace(/\s+/g, ' ').trim()).to.equal('Count: 0');
          expect(element.getAttribute('data-count')).to.equal('0');
        }
        expect(source.replace(/\s+/g, '')).to.contain(
          "this.$el0=this.querySelector(':scope>div:nth-of-type(1)>span:nth-of-type(2)')",
        );
        expect(source.replace(/\s+/g, '')).to.contain(
          "this.$el1=this.querySelector(':scope>p:nth-of-type(2)')",
        );
        expect(source.replace(/\s+/g, '')).to.contain(
          'this.$el0.textContent=Fragments.$$tmpl0(this.count.get())',
        );
        expect(source.replace(/\s+/g, '')).to.contain(
          'this.$el1.textContent=Fragments.$$tmpl1(this.count.get())',
        );
        expect(source.replace(/\s+/g, '')).to.contain(
          "this.$el0.setAttribute('data-count',this.count.get())",
        );
        expect(source.replace(/\s+/g, '')).to.contain(
          "this.$el1.setAttribute('data-count',this.count.get())",
        );
      });
    });
  }

  // this.attachShadow({ mode: 'open' });
  // <>
  //   <h1>Hello</h1>
  //   <>
  //     <button onclick={this.greet}>Greet</button>
  //     <button onclick={() => this.greet()}>Greet</button>
  //   </>
  // </>
  it('should preserve fragment siblings and emit Shadow DOM listeners', async () => {
    const { html, metadata } = await renderToString(new URL('./src/shadow.jsx', import.meta.url));
    const template = new JSDOM(html).window.document.querySelector(
      'wcc-shadow-fragments template[shadowrootmode="open"]',
    );

    expect(Array.from(template.content.children, (child) => child.tagName)).to.deep.equal([
      'H1',
      'BUTTON',
      'BUTTON',
    ]);
    const source = metadata['wcc-shadow-fragments'].source;
    const expected = await fs.readFile(
      new URL('./fixtures/shadow/render.txt', import.meta.url),
      'utf8',
    );

    expect(source.replace(/\s+/g, '')).to.contain(expected.replace(/\s+/g, ''));
    expect(source.replace(/\s+/g, '')).to.contain('#evInitialized=false;');
    expect(source.indexOf('this.shadowRoot.innerHTML =')).to.be.lessThan(
      source.indexOf('const $evRoot0 ='),
    );
  });

  // <>
  //   {[1, 2].map((id) => (
  //     <>
  //       <button onclick={() => this.select(id)}>Item {id}</button>
  //       <span>{id}</span>
  //     </>
  //   ))}
  // </>
  it('should emit mapped fragment siblings and their event bindings', async () => {
    const { html, metadata } = await renderToString(new URL('./src/loops.tsx', import.meta.url));
    const component = new JSDOM(html).window.document.querySelector('wcc-fragment-loops');
    const source = metadata['wcc-fragment-loops'].source;
    const expected = await fs.readFile(
      new URL('./fixtures/loops/render.txt', import.meta.url),
      'utf8',
    );

    expect(Array.from(component.children, (child) => child.tagName)).to.deep.equal([
      'BUTTON',
      'SPAN',
      'BUTTON',
      'SPAN',
    ]);
    expect(Array.from(component.children, (child) => child.textContent)).to.deep.equal([
      'Item 1',
      '1',
      'Item 2',
      '2',
    ]);
    expect(source.replace(/\s+/g, '')).to.contain(expected.replace(/\s+/g, ''));
  });

  // <>
  //   <div><span>Nested static</span><button>Nested static</button></div>
  //   <span data-count={count.get()}>{count.get()}</span>
  //   <button onclick={this.increment}>Root</button>
  // </>
  for (const [mode, extension] of [
    ['light', 'jsx'],
    ['shadow', 'tsx'],
  ]) {
    it(`should anchor ${mode} DOM reactive references and listeners to immediate children`, async () => {
      const { html, metadata } = await renderToString(
        new URL(`./src/${mode}-targets.${extension}`, import.meta.url),
      );
      const source = metadata[`wcc-${mode}-fragment-targets`].source;
      const references = await fs.readFile(
        new URL(`./fixtures/${mode}-targets/references.txt`, import.meta.url),
        'utf8',
      );
      const listeners = await fs.readFile(
        new URL(`./fixtures/${mode}-targets/listeners.txt`, import.meta.url),
        'utf8',
      );
      const component = new JSDOM(html).window.document.querySelector(
        `wcc-${mode}-fragment-targets`,
      );
      const root = mode === 'shadow' ? component.querySelector('template').content : component;

      expect(Array.from(root.children, (child) => child.tagName)).to.deep.equal([
        'DIV',
        'SPAN',
        'BUTTON',
      ]);
      expect(Array.from(root.children[0].children, (child) => child.textContent)).to.deep.equal([
        'Nested static',
        'Nested static',
      ]);
      expect(root.children[1].textContent).to.equal('0');
      expect(root.children[2].textContent).to.equal('Root');
      expect(source.replace(/\s+/g, '')).to.contain(references.replace(/\s+/g, ''));
      expect(source.replace(/\s+/g, '')).to.contain(listeners.replace(/\s+/g, ''));
    });
  }

  // $$root() { return 'authored'; }
  // <><span>{count.get()}</span><button onclick={this.increment}>Root</button></>
  it('should share one Shadow DOM lookup helper without overwriting an authored method', async () => {
    const { metadata } = await renderToString(new URL('./src/shadow-targets.tsx', import.meta.url));
    const source = metadata['wcc-shadow-fragment-targets'].source;
    const expected = await fs.readFile(
      new URL('./fixtures/shadow-targets/root-lookup.txt', import.meta.url),
      'utf8',
    );

    expect(source.replace(/\s+/g, '')).to.contain(expected.replace(/\s+/g, ''));
    expect(source.match(/\$\$root_\(selector\)/g)).to.have.length(1);
    expect(source).to.contain("return 'authored';");
  });

  // const value = '<text>';
  // const saved = <><span>Saved</span><span>{value}</span></>;
  // return <>{saved}</>;
  it('should preserve saved fragment siblings when rendered later', async () => {
    const { html, metadata } = await renderToString(new URL('./src/saved.jsx', import.meta.url));
    const component = new JSDOM(html).window.document.querySelector('wcc-saved-fragments');
    const source = metadata['wcc-saved-fragments'].source;
    const expected = await fs.readFile(
      new URL('./fixtures/saved/render.txt', import.meta.url),
      'utf8',
    );

    expect(Array.from(component.children, (child) => child.tagName)).to.deep.equal([
      'SPAN',
      'SPAN',
    ]);
    expect(Array.from(component.children, (child) => child.textContent)).to.deep.equal([
      'Saved',
      '<text>',
    ]);
    expect(source.replace(/\s+/g, '')).to.contain(expected.replace(/\s+/g, ''));
  });

  // return <></>;
  it('should emit empty HTML for an empty root fragment', async () => {
    const { html, metadata } = await renderToString(new URL('./src/empty.tsx', import.meta.url));

    expect(html.replace(/>\s+</g, '><').trim()).to.equal(
      '<wcc-empty-fragments></wcc-empty-fragments>',
    );
    expect(metadata['wcc-empty-fragments'].source.replace(/\s+/g, '')).to.contain(
      'this.innerHTML=``;',
    );
  });
});
