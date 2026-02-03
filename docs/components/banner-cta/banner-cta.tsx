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
          WCC (WC Compiler) is a NodeJS package for server-rendering native Web Components. It
          outputs static HTML based on either Light DOM or Declarative Shadow DOM usage, supports
          Constructable Stylesheets, includes a minimal DOM shim, and more!
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
