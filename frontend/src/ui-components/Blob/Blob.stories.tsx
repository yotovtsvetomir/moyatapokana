import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Blob from './Blob';

const meta: Meta<typeof Blob> = {
  title: 'UI/Blob',
  component: Blob,
  tags: ['autodocs'],
  args: {
    label: 'Рожден ден',
    count: 5,
  },
};

export default meta;

type Story = StoryObj<typeof Blob>;

export const Default: Story = {};

export const WithLargeCount: Story = {
  args: {
    label: 'Сватба / Рустик',
    count: 23,
  },
};

export const WithoutCount: Story = {
  args: {
    label: 'Корпоративен',
    count: undefined,
  },
};

export const Clickable: Story = {
  args: {
    label: 'Натисни!',
    count: 3,
    onClick: () => alert('Натиснат!'),
  },
};
