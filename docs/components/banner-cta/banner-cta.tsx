import '../ctc-button/ctc-button.tsx';
import styles from './banner-cta.module.css';

export default class BannerCta extends HTMLElement {
  static code = 'npm i -D wc-compiler';

  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <div class={styles.container}>
        <p>
          WCC (WC Compiler) is a NodeJS based package for server-rendering <em>native</em> Web
          Components. No custom formats, no custom syntax. It's just standard JavaScript in,
          standard HTML out.
        </p>
        <div class={styles.snippetContainer}>
          <div class={styles.snippet}>
            <pre>&dollar; {BannerCta.code}</pre>
            <wcc-ctc-button content={BannerCta.code}></wcc-ctc-button>
          </div>
        </div>
      </div>
    );
  }
}

customElements.define('wcc-banner-cta', BannerCta);
