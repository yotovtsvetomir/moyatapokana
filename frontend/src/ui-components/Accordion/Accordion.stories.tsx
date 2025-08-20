import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Accordion from './Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  args: {
    title: 'Ще присъства ли Георги Петров?',
    children: (
      <>
        <p><strong>Тип:</strong> дете</p>
        <p><strong>Меню:</strong> вегетарианско</p>
      </>
    ),
    defaultOpen: false,
  },
};
