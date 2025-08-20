import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {},
};

export const LargeOrange: Story = {
  args: {
    size: 60,
    color: 'var(--color-highlight-3)',
  },
};

export const SmallDark: Story = {
  args: {
    size: 24,
    color: 'var(--color-dark-300)',
  },
};