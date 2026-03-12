import { html } from 'lit';
import Footer from './footer.tsx';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta = {
  title: 'Components/Footer',
} satisfies Meta<typeof Footer>;

export default meta;

export const Primary = () => {
  return html`<wcc-footer></wcc-footer`;
};
