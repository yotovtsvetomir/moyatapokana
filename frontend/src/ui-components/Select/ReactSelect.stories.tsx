import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react'
import ReactSelect, { Option } from './ReactSelect'

const meta: Meta<typeof ReactSelect> = {
  title: 'UI/ReactSelect',
  component: ReactSelect,
}
export default meta

const options: Option[] = [
  { value: 'small', label: 'Малък' },
  { value: 'medium', label: 'Среден' },
  { value: 'large', label: 'Голям' },
]

export const Default: StoryObj = {
  render: () => {
    const [value, setValue] = useState<Option | null | undefined>(options[0])

    return (
      <div style={{ width: 250 }}>
        <ReactSelect
          options={options}
          value={value}
          onChange={setValue}
          placeholder="Изберете размер"
        />
      </div>
    )
  },
}
