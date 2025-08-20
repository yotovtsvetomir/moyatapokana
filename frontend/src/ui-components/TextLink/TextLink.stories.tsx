import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextLink } from './TextLink';

const meta: Meta<typeof TextLink> = {
  title: 'Components/TextLink',
  component: TextLink,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof TextLink>;

export const Accent: Story = {
  render: () => <TextLink href="/accent">Акцентен линк</TextLink>,
};

export const Muted: Story = {
  render: () => <TextLink href="/muted" color="muted">Затъмнен линк</TextLink>,
};

export const External: Story = {
  render: () => (
    <TextLink href="https://google.com" external>
      Външен линк (акцент)
    </TextLink>
  ),
};
