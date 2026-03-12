import { html } from 'lit';
import Header from './header.tsx';
import pages from '../../../.greenwood/graph.json' with { type: 'json' };
import type { Meta } from '@storybook/web-components';

const meta = {
  title: 'Components/Header',
  parameters: {
    fetchMock: {
      mocks: [
        {
          matcher: {
            url: 'http://localhost:1984/___graph.json',
            response: {
              body: pages.filter((page) => page.data.collection === 'nav'),
            },
          },
        },
      ],
    },
  },
} satisfies Meta<typeof Header>;

export default meta;

export const Primary = () => {
  return html`<wcc-header></wcc-header>`;
};
