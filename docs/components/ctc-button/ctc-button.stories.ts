import { html } from 'lit';
import CopyToClipboardButton from './ctc-button.tsx';
import type { Meta } from '@storybook/web-components';

const meta = {
  title: 'Components/Copy to Clipboard Button',
} satisfies Meta<typeof CopyToClipboardButton>;

export default meta;

export const Primary = () => {
  return html`<wcc-ctc-button content="npm i -D wc-compiler"></wcc-ctc-button>`;
};
