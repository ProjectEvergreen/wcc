import { html } from 'lit';
import CopyToClipboardBlock from './ctc-block.ts';
import type { Meta } from '@storybook/web-components';

const meta = {
  title: 'Components/Copy To Clipboard Block',
} satisfies Meta<typeof CopyToClipboardBlock>;

export default meta;

export const SnippetTemplate = () => `
  <wcc-ctc-block variant="snippet" heading="src/components/greeting.js">
    <pre class="language-js"><code class="language-js"><span class="token keyword module">import</span> <span class="token imports"><span class="token punctuation">{</span> html<span class="token punctuation">,</span> css<span class="token punctuation">,</span> <span class="token maybe-class-name">LitElement</span> <span class="token punctuation">}</span></span> <span class="token keyword module">from</span> <span class="token string">"lit"</span><span class="token punctuation">;</span>

<span class="token keyword module">export</span> <span class="token keyword">class</span> <span class="token class-name">SimpleGreeting</span> <span class="token keyword">extends</span> <span class="token class-name">LitElement</span> <span class="token punctuation">{</span>
  <span class="token keyword">static</span> styles <span class="token operator">=</span> css<span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token css language-css">
    <span class="token selector">p</span> <span class="token punctuation">{</span>
      <span class="token property">color</span><span class="token punctuation">:</span> <span class="token color">blue</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  </span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">;</span>

  <span class="token keyword">static</span> properties <span class="token operator">=</span> <span class="token punctuation">{</span>
    <span class="token literal-property property">name</span><span class="token operator">:</span> <span class="token punctuation">{</span> <span class="token literal-property property">type</span><span class="token operator">:</span> <span class="token known-class-name class-name">String</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token property-access">name</span> <span class="token operator">=</span> <span class="token string">"Somebody"</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword control-flow">return</span> html<span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token html language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&#x3C;</span>p</span><span class="token punctuation">></span></span>Hello, <span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token property-access">name</span><span class="token interpolation-punctuation punctuation">}</span></span>!<span class="token tag"><span class="token tag"><span class="token punctuation">&#x3C;/</span>p</span><span class="token punctuation">></span></span></span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>
  </wcc-ctc-block>
`;

export const ShellScriptTemplate = () => `
  <wcc-ctc-block variant="shell" paste-contents="npx @greenwood/init@latest my-app">
    <pre class="language-shell"><code class="language-shell">
    <span class="token comment"># initialize a new directory called my-app for your Greenwood project</span>
    $ npx @greenwood/init@latest my-app
    </code></pre>
  </wcc-ctc-block>
`;
