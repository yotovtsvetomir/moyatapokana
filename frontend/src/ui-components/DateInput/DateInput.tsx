import React, { useRef, useEffect } from 'react'
import Flatpickr from 'flatpickr'
import 'flatpickr/dist/themes/material_orange.css'
import 'flatpickr/dist/l10n/bg.js'
import styles from '../Input/Input.module.css'

interface DateInputProps {
  id: string
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
    if (!inputRef.current) return;

    fpRef.current = Flatpickr(inputRef.current, {
      enableTime: true,
      time_24hr: true,
      dateFormat: 'Y-m-d H:i',
      locale: 'bg', // set locale to Bulgarian
      defaultDate: value || undefined,
      allowInput: true,
      clickOpens: true,
      onChange: ([date]) => onChange(date || null),
      onClose: ([date]) => onChange(date || null)
    });

    return () => fpRef.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fpRef.current) {
      if (value) {
        fpRef.current.setDate(value, false)
      } else {
        fpRef.current.clear()
      }
    }
  }, [value])

  return (
    <div className={`${styles.inputGroup} ${error ? styles.hasMessage : ''}`}>
      <input
        ref={inputRef}
        value={value ? new Date(value).toLocaleString('bg-BG') : ''}
        onChange={() => {}}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        disabled={disabled}
        className={`${styles.input} ${styles.floatingInput} ${error ? styles.inputError : ''}`}
      />
      <label htmlFor={id} className={styles.floatingLabel}>
        {label}
      </label>
      <p className={`${styles.errorMessage} ${error ? styles.show : ''}`}>{error}</p>
    </div>
  )
}

export default DateInput
