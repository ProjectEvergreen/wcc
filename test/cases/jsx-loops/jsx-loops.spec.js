import { expect } from 'chai';
import fs from 'node:fs';
import { renderFromHTML } from 'wc-compiler';

function normalize(source) {
  return source.replace(/ /g, '').replace(/\n/g, '');
}

function expectOutput(source, fixture) {
  const expected = fs.readFileSync(new URL(`./fixtures/${fixture}.txt`, import.meta.url), 'utf-8');
  expect(normalize(source)).to.contain(normalize(expected));
}

describe('JSX loops compiler output', () => {
  const sources = new Map();

  before(async () => {
    for (const [file, tags] of [
      ['posts.jsx', ['wcc-loop-posts']],
      ['lists.jsx', ['wcc-loop-lists']],
      ['multiple-components.jsx', ['wcc-loop-first', 'wcc-loop-second']],
      ['shadow-dom.jsx', ['wcc-loop-shadow']],
      ['comments.tsx', ['wcc-loop-comments']],
      ['mixed.tsx', ['wcc-mixed-children']],
      ['imported.jsx', ['wcc-imported-mixed-children']],
      ['values.jsx', ['wcc-mixed-value-source']],
    ]) {
      const { metadata } = await renderFromHTML(tags.map((tag) => `<${tag}></${tag}>`).join(''), [
        new URL(`./src/${file}`, import.meta.url),
      ]);
      sources.set(file, metadata[tags[0]].source);
    }
  });

  it('emits map callbacks, joining, escaping and block returns', () => {
    const source = sources.get('posts.jsx');
    expectOutput(source, 'posts/render');
    expectOutput(source, 'posts/child-normalizer');
    expect(source.match(/static \$\$wccChild\(value\)/g)).to.have.length(1);
  });

  it('emits saved maps, chains, nested maps, flatMap, forEach, helper returns and escaped attributes', () => {
    const source = sources.get('lists.jsx');
    expectOutput(source, 'lists/render');
    expectOutput(source, 'lists/helper');
    expectOutput(source, 'lists/module-helpers');
    expect(source).to.contain("const $$wccMarkup = 'authored name';");
    expect(source.match(/static \$\$wcc_Child\(value\)/g)).to.have.length(1);
    expect(source.match(/function \$\$wcc_Child\(value\)/g)).to.have.length(1);
    expect(source.match(/static \$\$escapeHtml =/g)).to.have.length(1);
    expect(source.match(/const \$\$wcc_EscapeHtml =/g)).to.have.length(1);
  });

  it('qualifies child normalizer calls with their owning component class', () => {
    const source = sources.get('multiple-components.jsx');
    expectOutput(source, 'multiple/first');
    expectOutput(source, 'multiple/second');
    expect(source.match(/static \$\$wccChild\(value\)/g)).to.have.length(2);
  });

  it('emits component references at the correct depth inside mapped handlers', () => {
    const source = sources.get('lists.jsx');
    expect(source).to.contain('})(event, this.parentElement.parentElement.parentElement)');
    expect(source).to.contain(
      'onclick="this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.action(event)"',
    );
  });

  it('emits Shadow DOM rendering and mapped host handlers', () => {
    expectOutput(sources.get('shadow-dom.jsx'), 'shadow-dom/render');
  });

  it('emits TSX reply maps alongside visibility effects, cleanup and grouped static methods', () => {
    const source = sources.get('comments.tsx');
    expectOutput(source, 'comments/render');
    expectOutput(source, 'comments/connected-callback');
    expectOutput(source, 'comments/disconnected-callback');

    const actual = normalize(source);
    expect(actual).to.contain('exportdefaultclassCommentsextendsHTMLElement{$el0;$el1;static');

    const parseIndex = actual.indexOf('staticparseAttribute');
    const childIndex = actual.indexOf('static$$wccChild');
    const callbackIndex = actual.indexOf('attributeChangedCallback(');
    expect(parseIndex).to.be.greaterThan(-1);
    expect(childIndex).to.be.greaterThan(parseIndex);
    expect(callbackIndex).to.be.greaterThan(childIndex);
    expect(actual).to.match(/staticparseAttribute=[^;]*;static\$\$wccChild\(value\)/);
  });

  describe('Mixed arrays', () => {
    it('preserves JSX identity through mixed arrays, aliases, nested arrays and push', () => {
      const source = sources.get('mixed.tsx');
      expectOutput(source, 'mixed/render');
      expectOutput(source, 'mixed/wrapper');
    });

    it('emits recursive child serialization that preserves markup, escapes text and retains zero', () => {
      expectOutput(sources.get('mixed.tsx'), 'mixed/child-serializer');
    });

    it('marks JSX returned from a separately compiled helper module', () => {
      const source = sources.get('values.jsx');
      expectOutput(source, 'values/create-children');
      expectOutput(source, 'values/wrapper');
      expectOutput(source, 'values/child-serializer');
    });

    it('recognizes imported JSX values with the same marker in the consuming component', () => {
      const source = sources.get('imported.jsx');
      expectOutput(source, 'imported/render');
      expectOutput(source, 'imported/child-serializer');
      expect(source).to.contain("import {createChildren} from './values.jsx';");
    });
  });
});
