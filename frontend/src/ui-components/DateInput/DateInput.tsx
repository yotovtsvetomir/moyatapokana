import React, { useRef, useEffect } from 'react'
import Flatpickr from 'flatpickr'
import 'flatpickr/dist/themes/material_orange.css'
import styles from '../Input/Input.module.css'

interface DateInputProps {
  id: string
  name: string
  value: string
  label: string
  error?: string
  placeholder?: string
  onChange: (date: Date | null) => void
  required?: boolean
  disabled?: boolean
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  name,
  value,
  label,
  error,
  placeholder = ' ',
  onChange,
  required = false,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const fpRef = useRef<Flatpickr.Instance | null>(null)

  useEffect(() => {
    if (inputRef.current) {
      fpRef.current?.destroy()

      fpRef.current = Flatpickr(inputRef.current, {
        enableTime: true,
        time_24hr: true,
        dateFormat: 'Y-m-d H:i',
        defaultDate: value || undefined,
        onChange: ([date]) => {
          onChange(date || null)
        }
      })
    }

    return () => {
      fpRef.current?.destroy()
    }
  }, [value, onChange])

  return (
    <div className={`${styles.inputGroup} ${error ? styles.hasMessage : ''}`}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        disabled={disabled}
        value={value ? new Date(value).toLocaleString('bg-BG') : ''}
        readOnly
        className={`${styles.input} ${styles.floatingInput} ${
          error ? styles.inputError : ''
        }`}
      />
      <label htmlFor={id} className={styles.floatingLabel}>
        {label}
      </label>
      <p className={`${styles.errorMessage} ${error ? styles.show : ''}`}>{error}</p>
    </div>
  )
}

export default DateInput
