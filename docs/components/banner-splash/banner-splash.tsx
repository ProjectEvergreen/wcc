import styles from './banner-splash.module.css';

export default class BannerSplash extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <h1>
        <span class={styles.splash}>SSR</span> for Web Components
      </h1>
    );
  }
}

customElements.define('wcc-banner-splash', BannerSplash);
