import { html } from 'lit';
import CapabilityBox from './capability-box.tsx';
import type { Meta } from '@storybook/web-components';

const meta = {
  title: 'Components/Capability Box',
} satisfies Meta<typeof CapabilityBox>;

export default meta;

export const Primary = () => {
  return html`
    <wcc-capability-box heading="This is a title">
      <p>This is some content</p>
    </wcc-capability-box>
  `;
};
