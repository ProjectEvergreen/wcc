import * as monaco from 'monaco-editor';
import { prettify } from 'htmlfy';
// TODO: https://github.com/brijeshb42/monaco-themes/issues/65
import nightOwlThemeSource from '../../../node_modules/monaco-themes/themes/Night Owl.json?type=text';

const nightOwlTheme = JSON.parse(nightOwlThemeSource) as monaco.editor.IStandaloneThemeData;

const inputContainer = document.getElementById('input-content') as HTMLDivElement;
const outputContainer = document.getElementById('output-content') as HTMLDivElement;
const workerUrl = new URL('./repl.ts', import.meta.url);
let worker: Worker | undefined;

const inputContents = `
const template = document.createElement('template');

template.innerHTML = \`
  <style>
    .footer {
      color: white;
      background-color: #192a27;
    }
  </style>

  <footer class="footer">
    <h4>My Blog &copy; \${new Date().getFullYear()}</h4>
  </footer>
\`;

class Footer extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export default Footer;

customElements.define('wcc-footer', Footer);
`;

monaco.editor.defineTheme('custom-theme', {
  ...nightOwlTheme,
  // have to specify `base` explicitly or else TS complains
  base: 'vs-dark',
});

const commonSettings = {
  fontFamily: 'Geist-Mono',
  fontSize: 16,
  minimap: { enabled: false },
  colorDecorators: false, // Disables hex color swatches and picker
  automaticLayout: true,
  theme: 'custom-theme',
};

function initialize() {
  const inputEditor = monaco.editor.create(inputContainer, {
    value: inputContents.trim(),
    language: 'javascript',
    ...commonSettings,
    ariaLabel: 'Web Component JavaScript input',
  });
  const outputEditor = monaco.editor.create(outputContainer, {
    language: 'html',
    ...commonSettings,
    readOnly: true,
    ariaLabel: 'Rendered HTML output',
  });

  const status = document.getElementById('playground-status') as HTMLParagraphElement;
  let timer: ReturnType<typeof setTimeout>;

  function compile() {
    // A fresh worker resets WCC's module cache and custom element registry on every edit.
    worker?.terminate();
    worker = new Worker(workerUrl, { type: 'module' });
    status.textContent = 'Compiling…';
    worker.onmessage = ({ data }) => {
      if (data.error) {
        status.textContent = data.error;
        outputEditor.setValue('');
      } else {
        outputEditor.setValue(prettify(data.output));
        status.textContent = 'Compiled successfully.';
      }
    };
    worker.onerror = () => {
      status.textContent = 'Unable to compile. Check the browser console for details.';
    };
    worker.postMessage([inputEditor.getValue()]);
  }

  inputEditor.onDidChangeModelContent(() => {
    worker?.terminate();
    clearTimeout(timer);
    timer = setTimeout(compile, 300);
  });
  compile();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
