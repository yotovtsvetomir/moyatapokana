import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import MobileMenu from './MobileMenu';

const meta: Meta<typeof MobileMenu> = {
  title: 'Components/MobileMenu',
  component: MobileMenu,
  tags: ['autodocs'],
  args: {
    open: true,
    onClose: () => alert('Menu closed'),
    mainLinks: [
      { href: '/', label: 'Начало' },
      { href: '/templates', label: 'Покани шаблони' },
      { href: '/invitations/create', label: 'Създай покана' },
      { href: '/about', label: 'За нас' },
      { href: '/contact', label: 'Контакт' },
    ]
  },
};

export default meta;
type Story = StoryObj<typeof MobileMenu>;

export const Default: Story = {};

export const LoggedOut: Story = {};
