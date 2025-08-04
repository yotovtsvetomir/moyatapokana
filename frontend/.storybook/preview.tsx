import type { Preview } from '@storybook/nextjs';
import { Nunito } from 'next/font/google';
import '../src/styles/global.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  display: 'swap',
});

const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '812px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
      },
      defaultViewport: 'responsive',
    },
  },
  decorators: [
    (Story) => (
      <div className={nunito.variable}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
