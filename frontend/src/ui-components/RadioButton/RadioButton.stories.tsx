import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React, { useState } from 'react';
import RadioButton from './RadioButton';

const meta: Meta<typeof RadioButton> = {
  title: 'Components/RadioButton',
  component: RadioButton,
};

export default meta;
type Story = StoryObj<typeof RadioButton>;

export const Basic: Story = {
  render: () => {
    const [selected, setSelected] = useState('female');
    return (
      <div>
        <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Пол</p>
        <RadioButton
          name="gender"
          label="Жена"
          value="female"
          selected={selected === 'female'}
          onSelect={setSelected}
        />
        <RadioButton
          name="gender"
          label="Мъж"
          value="male"
          selected={selected === 'male'}
          onSelect={setSelected}
        />
      </div>
    );
  },
};
