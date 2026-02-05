import styles from './feature-box.module.css';
import html from '../../assets/html.svg?type=raw';
import json from '../../assets/json.svg?type=raw';
import typescript from '../../assets/typescript-logo.svg?type=raw';

export default class FeatureBox extends HTMLElement {
  static ICON_MAPPER: { [key: string]: string } = {
    JSX: html,
    TypeScript: typescript,
    Pluggable: json,
  };

  connectedCallback() {
    this.render();
  }

  render() {
    const heading = this.getAttribute('heading');
    const { innerHTML } = this;
    const icon = FeatureBox.ICON_MAPPER[heading];

    return (
      <div class={styles.container}>
        <span class={styles.heading}>
          <span class={styles.icon}>{icon}</span>
          <span>{heading}</span>
        </span>
        {innerHTML}
      </div>
    );
  }
}

customElements.define('wcc-feature-box', FeatureBox);
