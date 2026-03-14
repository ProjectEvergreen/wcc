import { html } from 'lit';
import SocialTray from './social-tray.tsx';
import type { Meta } from '@storybook/web-components';

const meta = {
  title: 'Components/Social Tray',
} satisfies Meta<typeof SocialTray>;

export default meta;

export const Primary = () => {
  return html`<wcc-social-tray></wcc-social-tray>`;
};
