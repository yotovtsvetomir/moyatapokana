import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React, { useState } from 'react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('example@goodemail.com');
    return (
      <Input
        id="email"
        name="email"
        label="Имейл"
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState('example@wrong');
    return (
      <Input
        id="email-error"
        name="email"
        label="Имейл"
        type="email"
        error="Невалиден имейл адрес"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const Password: Story = {
  render: () => {
    const [value, setValue] = useState('MySecret123');
    return (
      <Input
        id="password"
        name="password"
        label="Парола"
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const Text: Story = {
  render: () => {
    const [value, setValue] = useState('ivan.petrov');
    return (
      <Input
        id="username"
        name="username"
        label="Потребителско име"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const Large: Story = {
  render: () => {
    const [value, setValue] = useState('ivan.petrov');
    return (
      <Input
        id="username"
        name="username"
        label="Потребителско име"
        type="text"
        value={value}
        size="large"
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const WithIcon: Story = {
  render: () => {
    const [value, setValue] = useState('Покана за рожден ден');
    return (
      <Input
        id="username-icon"
        name="username"
        label="Име на събитието"
        icon="event"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Input
      id="disabled"
      name="disabled"
      label="Неактивно"
      type="text"
      value="Неактивно"
      onChange={() => {}}
      required
      disabled
      placeholder=" "
    />
  ),
};
