import { html } from 'lit';
import BannerCta from './banner-cta.tsx';
import type { Meta } from '@storybook/web-components';

const meta = {
  title: 'Components/Banner CTA',
} satisfies Meta<typeof BannerCta>;

export default meta;

export const Primary = () => {
  return html`<wcc-banner-cta></wcc-banner-cta>`;
};
