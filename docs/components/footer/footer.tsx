import styles from './footer.module.css';
import '../social-tray/social-tray.tsx';
import wccLogo from '../../assets/wcc-logo.svg?type=raw';

export default class Footer extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <footer class={styles.container}>
        <a href="/" title="WCC Home Page" class={styles.logoLink}>
          {wccLogo}
        </a>

        <div class={styles.socialTray}>
          <wcc-social-tray></wcc-social-tray>
        </div>
      </footer>
    );
  }
}

customElements.define('wcc-footer', Footer);
