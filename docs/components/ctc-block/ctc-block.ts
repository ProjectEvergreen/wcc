import theme from '../../styles/theme.css' with { type: 'css' };
import sheet from './ctc-block.css' with { type: 'css' };
import copyIcon from '../../assets/copy-button.svg?type=raw';

const template = document.createElement('template');

export default class CopyToClipboardBlock extends HTMLElement {
  selectCommandRunnerIdx;
  snippetContents;

  constructor() {
    super();
    this.selectCommandRunnerIdx = 0;
    this.snippetContents = '';
  }

  connectedCallback() {
    const variant = this.getAttribute('variant');

    if (!this.shadowRoot && typeof window !== 'undefined') {
      if (variant === 'snippet') {
        const heading = this.getAttribute('heading');
        const headingHtml = heading ? `<span class="heading">${heading}</span>` : '';

        this.snippetContents = this.textContent.trim();
        template.innerHTML = `
          <div class="snippet-container">
            <div class="snippet">
              ${headingHtml}
              <span class="copy-icon">
                ${copyIcon}
              </span>
              ${this.innerHTML}
            </div>
          </div>
        `;
      } else if (variant === 'shell') {
        this.snippetContents = this.textContent.trim();
        template.innerHTML = `
            <div class="shell-container">
              <span class="copy-icon">
                ${copyIcon}
              </span>
              ${this.innerHTML}
            </div>
          `;
      } else {
        console.warn(`Unknown variant provided => ${variant}`);
      }

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      switch (variant) {
        case 'snippet':
          this.shadowRoot
            .querySelector('.copy-icon')
            .addEventListener('click', this.copySnippetToClipboard.bind(this));
          break;
        case 'shell':
          this.shadowRoot
            .querySelector('.copy-icon')
            .addEventListener('click', this.copyShellScriptToClipboard.bind(this));
          break;
      }

      this.shadowRoot.adoptedStyleSheets = [theme, sheet];
    }
  }

  copySnippetToClipboard() {
    const contents = this.snippetContents;

    navigator.clipboard.writeText(contents);
    console.log('copying the following contents to your clipboard =>', contents);
  }

  copyShellScriptToClipboard() {
    const contents = this.getAttribute('paste-contents').trim();

    navigator.clipboard.writeText(contents);
    console.log('copying the following contents to your clipboard =>', contents);
  }
}

customElements.define('wcc-ctc-block', CopyToClipboardBlock);
