import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react'
import ColorPicker from './ColorPicker'

const meta: Meta<typeof ColorPicker> = {
  title: 'UI/ColorPicker',
  component: ColorPicker,
}
export default meta

type Story = StoryObj<typeof ColorPicker>

export const Default: Story = {
  render: () => {
    const [color, setColor] = useState('#FF6A5B')

    return (
      <div style={{ padding: '2rem', backgroundColor: '#f5f5f5' }}>
        <ColorPicker color={color} onChange={setColor} />
      </div>
    )
  },
}
