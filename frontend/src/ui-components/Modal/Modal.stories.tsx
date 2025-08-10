import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Modal from './Modal'

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Modal>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true)

    return (
      <>
        {open && (
          <Modal
            title="Вече имате чернова"
            description="Ако продължите, текущата чернова ще бъде изгубена. Искате ли да продължите?"
            confirmText="Продължи"
            cancelText="Отказ"
            onConfirm={() => {
              alert('Потвърдено')
              setOpen(false)
            }}
            onCancel={() => {
              alert('Отказано')
              setOpen(false)
            }}
          />
        )}
      </>
    )
  },
}
