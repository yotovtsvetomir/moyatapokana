import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heading } from './Heading';

const meta: Meta<typeof Heading> = {
  title: 'Components/Heading',
  component: Heading,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Heading>;

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Heading size="3xl">Заглавие 3XL</Heading>
      <Heading size="2xl">Заглавие 2XL</Heading>
      <Heading size="xl">Заглавие XL</Heading>
      <Heading size="lg">Заглавие LG</Heading>
      <Heading size="md">Заглавие MD</Heading>
      <Heading size="sm">Заглавие SM</Heading>
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <>
      <Heading align="left">Подравняване: Ляво</Heading>
      <Heading align="center">Подравняване: Център</Heading>
      <Heading align="right">Подравняване: Дясно</Heading>
    </>
  ),
};

export const Weights: Story = {
  render: () => (
    <>
      <Heading weight="medium">Тегло: Medium</Heading>
      <Heading weight="semi">Тегло: Semi</Heading>
      <Heading weight="bold">Тегло: Bold</Heading>
      <Heading weight="extrabold">Тегло: ExtraBold</Heading>
    </>
  ),
};

export const CustomTag: Story = {
  render: () => (
    <>
      <Heading as="h1">H1 Таг</Heading>
      <Heading as="h2">H2 Таг</Heading>
      <Heading as="h3">H3 Таг</Heading>
    </>
  ),
};

export const Colors: Story = {
  render: () => (
    <>
      <Heading color="default">Тъмен текст</Heading>
      <Heading color="highlight">Маркиран текст</Heading>
      <div style={{ background: '#2F3038', padding: '0.1rem' }}>
        <Heading color="white">Бял текст върху тъмен фон</Heading>
      </div>
    </>
  ),
};
