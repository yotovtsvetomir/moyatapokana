'use client'

import Select from 'react-select'

export interface Option {
  value: string
  label: string
  id?: string | number
  preview?: string
  presentationImage?: string | null
  key?: string | null
}

interface ReactSelectProps<T> {
  options: T[]
  value: T | null | undefined
  onChange: (option: T | null | undefined) => void
  placeholder?: string
  isDisabled?: boolean
  isClearable?: boolean
  isSearchable?: boolean
  color?: string
}

export default function ReactSelect<T extends { value: string; label: string }>({
  options,
  value,
  onChange,
  placeholder = 'Избери опция',
  isDisabled = false,
  isClearable = false,
  isSearchable = false,
  color = 'var(--color-highlight-1)', // default highlight color
}: ReactSelectProps<T>) {
  return (
    <Select<T>
      options={options}
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      isClearable={isClearable}
      placeholder={placeholder}
      isSearchable={isSearchable}
      classNamePrefix="select"
      styles={{
        control: (base, state) => ({
          ...base,
          outline: 'none',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: state.isFocused ? color : 'var(--color-neutral-200)',
          backgroundColor: 'var(--color-neutral-500)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--font-lg)',
          minHeight: 48,
          height: 48,
          boxShadow: 'none',
          padding: '0 1rem',
          cursor: 'pointer',
          '&:hover': {
            borderColor: color,
          },
        }),
        valueContainer: (base) => ({
          ...base,
          padding: 0,
          height: 48,
          display: 'flex',
          alignItems: 'center',
        }),
        singleValue: (base) => ({
          ...base,
          color: 'var(--color-dark-100)',
          fontWeight: 'var(--font-weight-medium)',
          fontSize: 'var(--font-lg)',
          margin: 0,
        }),
        placeholder: (base) => ({
          ...base,
          color: 'var(--color-dark-400)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--font-lg)',
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? color
            : state.isFocused
            ? 'var(--color-highlight-6)'
            : 'transparent',
          color: state.isSelected
            ? 'var(--color-neutral-500)'
            : 'var(--color-dark-100)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--font-lg)',
          fontWeight: state.isSelected
            ? 'var(--font-weight-semi)'
            : 'var(--font-weight-medium)',
          cursor: 'pointer',
          padding: '0.75rem 1rem',
        }),
        menu: (base) => ({
          ...base,
          borderRadius: 9,
          backgroundColor: 'var(--color-neutral-500)',
          zIndex: 9999,
          boxShadow: '0 4px 8px rgba(0,0,0,0.06)',
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: 'var(--color-dark-300)',
          '&:hover': {
            color: 'var(--color-dark-200)',
          },
        }),
        indicatorSeparator: () => ({
          display: 'none',
        }),
        input: (base) => ({
          ...base,
          fontSize: 'var(--font-lg)',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-dark-100)',
          margin: 0,
          padding: '0.75rem 0',
          height: 'auto',
        }),
      }}
    />
  )
}
