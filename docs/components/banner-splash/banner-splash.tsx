import styles from './banner-splash.module.css';

export default class BannerSplash extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <h1 class={styles.container}>
        <span class={styles.splash}>SSR</span>
        <span class={styles.text}> for Web Components</span>
      </h1>
    );
  }
}

customElements.define('wcc-banner-splash', BannerSplash);
