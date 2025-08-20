import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ShareBlock } from './ShareBlock';

const meta: Meta<typeof ShareBlock> = {
  title: 'UI/ShareBlock',
  component: ShareBlock,
};

export default meta;

type Story = StoryObj<typeof ShareBlock>;

export const Default: Story = {
  args: {
    shareUrl: 'https://moyatapokana.com/invitations/preview/123/?guest_token=abc123',
    invitationId: 123,
  },
};
