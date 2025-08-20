import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ProfileMenu from './ProfileMenu';

const meta: Meta<typeof ProfileMenu> = {
  title: 'UI/ProfileMenu',
  component: ProfileMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof ProfileMenu>;

export const Default: Story = {};
