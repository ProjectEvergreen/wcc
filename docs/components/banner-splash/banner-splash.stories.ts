import { html } from 'lit';
import BannerSplash from './banner-splash.tsx';
import type { Meta } from '@storybook/web-components';

const meta = {
  title: 'Components/Banner Splash',
} satisfies Meta<typeof BannerSplash>;

export default meta;

export const Primary = () => {
  return html`<wcc-banner-splash></wcc-banner-splash>`;
};
