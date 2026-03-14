import { html } from 'lit';
import FeatureBox from './feature-box.tsx';
import type { Meta } from '@storybook/web-components';

const meta = {
  title: 'Components/Feature Box',
} satisfies Meta<typeof FeatureBox>;

export default meta;

export const JSX = () => {
  return html`
    <wcc-feature-box heading="JSX">
      <p>This is some JSX content</p>
    </wcc-feature-box>
  `;
};

export const TypeScript = () => {
  return html`
    <wcc-feature-box heading="TypeScript">
      <p>This is some TypeScript content</p>
    </wcc-feature-box>
  `;
};

export const Pluggable = () => {
  return html`
    <wcc-feature-box heading="Pluggable">
      <p>This is some content</p>
    </wcc-feature-box>
  `;
};
