import copy from '../../assets/copy-button.svg?type=raw';
import sheet from './ctc-button.css' with { type: 'css' };

const template = document.createElement('template');

template.innerHTML = `
  <button id="icon" title="Copy to clipboard">${copy}</button>
`;

export default class CopyToClipboardButton extends HTMLElement {
  connectedCallback() {
    // bail of out of SSR entirely
    if (!this.shadowRoot && typeof window !== 'undefined') {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      this.shadowRoot.adoptedStyleSheets = [sheet];

      this.shadowRoot.getElementById('icon')?.addEventListener('click', () => {
        const contents = this.getAttribute('content') ?? undefined;

        navigator.clipboard.writeText(contents);
        console.log('copying the following contents to your clipboard =>', contents);
      });
    }
  }
}

customElements.define('wcc-ctc-button', CopyToClipboardButton);

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wcc-ctc-button': {
        content: string;
      };
    }
  }
}
