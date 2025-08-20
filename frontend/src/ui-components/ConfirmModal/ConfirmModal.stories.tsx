import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ConfirmModal from './ConfirmModal'

const meta: Meta<typeof ConfirmModal> = {
  title: 'UI/Modals/ConfirmModal',
  component: ConfirmModal,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof ConfirmModal>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true)

    return (
      <>
        {open && (
          <ConfirmModal
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
