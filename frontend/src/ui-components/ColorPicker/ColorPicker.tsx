'use client'

import { HexColorPicker } from 'react-colorful'
import { useState, useEffect } from 'react'
import styles from './ColorPicker.module.css'

interface Props {
  color: string
  onChange: (val: string) => void
}

export default function ColorPicker({ color, onChange }: Props) {
  const [inputValue, setInputValue] = useState(color)

  useEffect(() => {
    setInputValue(color)
  }, [color])

  const handleInputChange = (val: string) => {
    setInputValue(val)
    // Validate basic hex before applying
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val)
    }
  }

  return (
    <div className={styles.colorPickerWrapper}>
      <HexColorPicker color={color} onChange={(val) => {
        onChange(val)
        setInputValue(val)
      }} />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        className={styles.hexInput}
        placeholder="#RRGGBB"
        maxLength={7}
      />
    </div>
  )
}
