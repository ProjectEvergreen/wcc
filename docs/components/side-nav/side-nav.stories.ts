import { html } from 'lit';
import SideNav from './side-nav.tsx';
import pages from '../../../.greenwood/graph.json' with { type: 'json' };
import type { Meta } from '@storybook/web-components';

const GRAPH = [
  {
    id: 'docs',
    label: 'Docs',
    title: 'Docs',
    route: '/docs/',
    layout: 'docs',
    data: {
      collection: 'nav',
      order: 2,
      tocHeading: 2,
      tableOfContents: [
        {
          content: 'API',
          slug: 'api',
          lvl: 2,
          i: 1,
          seen: 0,
        },
        {
          content: 'Metadata',
          slug: 'metadata',
          lvl: 2,
          i: 4,
          seen: 0,
        },
        {
          content: 'Progressive Hydration',
          slug: 'progressive-hydration',
          lvl: 2,
          i: 5,
          seen: 0,
        },
        {
          content: 'Data',
          slug: 'data',
          lvl: 2,
          i: 6,
          seen: 0,
        },
        {
          content: 'Conventions',
          slug: 'conventions',
          lvl: 2,
          i: 9,
          seen: 0,
        },
        {
          content: 'TypeScript',
          slug: 'typescript',
          lvl: 2,
          i: 10,
          seen: 0,
        },
        {
          content: 'JSX',
          slug: 'jsx',
          lvl: 2,
          i: 12,
          seen: 0,
        },
      ],
    },
  },
];

const meta = {
  title: 'Components/Side Nav',
  parameters: {
    fetchMock: {
      mocks: [
        {
          matcher: {
            url: 'http://localhost:1984/___graph.json',
            response: {
              body: GRAPH,
            },
          },
        },
      ],
    },
  },
} satisfies Meta<typeof SideNav>;

export default meta;

export const Primary = () => {
  return html`<wcc-side-nav route="/docs/" heading="Docs"></wcc-side-nav>`;
};
