import styles from './feature-box.module.css';

export default class FeatureBox extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const heading = this.getAttribute('heading');
    const { innerHTML } = this;

    return (
      <div class={styles.container}>
        <span class={styles.heading}>{heading}</span>
        {innerHTML}
      </div>
    );
  }
}

customElements.define('wcc-feature-box', FeatureBox);
