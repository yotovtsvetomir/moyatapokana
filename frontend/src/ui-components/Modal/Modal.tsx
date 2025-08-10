'use client'

import React from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  title: string
  description: string | string[]
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function Modal({
  title,
  description,
  confirmText = 'Продължи',
  cancelText = 'Отказ',
  onConfirm,
  onCancel,
  danger,
}: ModalProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.description}>
          {Array.isArray(description)
            ? description.map((line, idx) => <p key={idx}>{line}</p>)
            : <p>{description}</p>}
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`${styles.confirmButton} ${danger ? styles.danger : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
