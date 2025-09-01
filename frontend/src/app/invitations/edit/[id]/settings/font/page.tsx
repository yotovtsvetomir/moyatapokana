'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import { useInvitation } from '@/context/InvitationContext'
import { Button } from '@/ui-components/Button/Button'
import { Spinner } from '@/ui-components/Spinner/Spinner'
import ReactSelect from '@/ui-components/Select/ReactSelect'
import type { Option } from '@/ui-components/Select/ReactSelect'
import type { components } from '@/shared/types'

type FontRead = components['schemas']['FontRead']

const toOption = (font: FontRead): Option => ({
  label: font.label,
  value: font.value,
  id: font.id,
})

export default function FontSettingsPage() {
  const { invitation, setInvitation } = useInvitation()
  const { id } = useParams()

  const [fonts, setFonts] = useState<FontRead[]>([])
  const [selectedFont, setSelectedFont] = useState<Option | null>(null)
  const [saving, setSaving] = useState(false)

  // Fetch all fonts
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const res = await fetch('/api/invitations/fonts', { credentials: 'include' })
        const data: FontRead[] = await res.json()
        setFonts(data)
      } catch (err) {
        console.error('Неуспешно зареждане на шрифтовете', err)
        setFonts([])
      }
    }
    fetchFonts()
  }, [])

  // Set currently selected font from invitation
  useEffect(() => {
    if (invitation?.selected_font && fonts.length > 0) {
      const match = fonts.find((f) => f.value === invitation.selected_font)
      setSelectedFont(match ? toOption(match) : null)
    }
  }, [invitation, fonts])

  if (!invitation) return <Spinner size={60} />

  const handleSave = async () => {
    if (!selectedFont) return

    setSaving(true)
    try {
      const res = await fetch(`/api/invitations/update/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_font: selectedFont.value }),
        credentials: 'include',
      })

      if (!res.ok) {
        let errorMessage = 'Неуспешно запазване на шрифта'
        try {
          const errorData = await res.json()
          errorMessage = errorData?.error || errorMessage
        } catch {}
        throw new Error(errorMessage)
      }

      const updated = await res.json()
      setInvitation(updated)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Неуспешно запазване')
    } finally {
      setSaving(false)
    }
  }

  const isUnchanged = invitation?.selected_font === selectedFont?.value
  const selectedFontObj = fonts.find((f) => f.value === selectedFont?.value)

  return (
    <div className="container fullHeight centerWrapper steps">
      <h1>Избор на шрифт за покана #{invitation.id}</h1>

      {/* Font Preview */}
      <div
        style={{
          marginBottom: '1rem',
          height: '3rem',
          paddingLeft: '1rem',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '6px',
          border: '1px solid var(--color-highlight-6)',
        }}
      >
        <p style={{ fontFamily: selectedFontObj?.font_family || 'inherit', fontSize: '1rem' }}>
          Примерен текст за преглед на шрифта
        </p>
      </div>

      <div
        style={{
          marginBottom: '1rem',
          height: '3.5rem',
          paddingLeft: '1rem',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '6px',
          border: '1px solid var(--color-highlight-6)',
        }}
      >
        <p style={{ fontFamily: selectedFontObj?.font_family || 'inherit', fontSize: '1.5rem' }}>
          Примерен текст за преглед на шрифта
        </p>
      </div>

      <ReactSelect
        options={[{ label: 'Без', value: '' }, ...fonts.map(toOption)]}
        value={selectedFont || { label: 'Без', value: '' }}
        onChange={(opt) => setSelectedFont(opt && opt.value ? opt : null)}
        placeholder="Избери шрифт"
      />

      <div className="editActions">
        <Link href={`/invitations/edit/${id}/settings`} style={{ width: '47%' }}>
          <Button variant="secondary" size="large" width="100%">
            Назад
          </Button>
        </Link>

        <Button onClick={handleSave} variant="primary" width="47%" size="large" disabled={saving || isUnchanged}>
          {saving ? 'Запазване...' : 'Запази'}
        </Button>
      </div>
    </div>
  )
}
