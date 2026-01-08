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
          WCC is a NodeJS package for easier server-rendering (SSR) of native Web Components. It can
          render your Web Components to static HTML supporting either Light DOM or Declarative
          Shadow DOM.
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
