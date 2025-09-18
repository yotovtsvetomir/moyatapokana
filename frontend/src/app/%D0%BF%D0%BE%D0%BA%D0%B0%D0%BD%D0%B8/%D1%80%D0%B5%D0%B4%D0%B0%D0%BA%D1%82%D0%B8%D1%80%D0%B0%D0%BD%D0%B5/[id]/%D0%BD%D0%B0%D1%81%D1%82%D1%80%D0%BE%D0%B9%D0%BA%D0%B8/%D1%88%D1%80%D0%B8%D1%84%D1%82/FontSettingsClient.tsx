'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/ui-components/Button/Button'
import ReactSelect, { Option } from '@/ui-components/Select/ReactSelect'
import { useInvitation } from '@/context/InvitationContext'
import type { components } from '@/shared/types';

type FontRead = components['schemas']['FontRead'];

interface Props {
  fonts: FontRead[]
}

const toOption = (font: FontRead): Option => ({
  label: font.label,
  value: font.value,
  id: font.id,
})

export default function FontSettingsClient({ fonts }: Props) {
  const { invitation, updateInvitation } = useInvitation()
  const { id } = useParams<{ id: string }>()
  const [selectedFont, setSelectedFont] = useState<Option | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (invitation?.selected_font) {
      const match = fonts.find(f => f.value === invitation.selected_font)
      setSelectedFont(match ? toOption(match) : null)
    } else {
      setSelectedFont(null)
    }
  }, [invitation, fonts])

  if (!invitation) return <p>Зареждане...</p>

  const handleSave = async () => {
    if (!selectedFont) return;
    setSaving(true);

    try {
      await updateInvitation({ selected_font: selectedFont.value });
    } finally {
      setSaving(false);
    }
  };

  const isUnchanged = invitation.selected_font === selectedFont?.value
  const selectedFontObj = fonts.find(f => f.value === selectedFont?.value)

  return (
    <div className="container fullHeight centerWrapper steps">
      <h1>Избор на шрифт за покана #{invitation.id}</h1>

      {/* Font Preview */}
      <div style={{ marginBottom: '1rem', height: '3rem', paddingLeft: '1rem', display: 'flex', alignItems: 'center', borderRadius: '6px', border: '1px solid var(--color-highlight-6)' }}>
        <p style={{ fontFamily: selectedFontObj?.font_family || 'inherit', fontSize: '1rem' }}>
          Примерен текст за преглед на шрифта
        </p>
      </div>

      <div style={{ marginBottom: '1rem', height: '3.5rem', paddingLeft: '1rem', display: 'flex', alignItems: 'center', borderRadius: '6px', border: '1px solid var(--color-highlight-6)' }}>
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
        <Button
          href={`/покани/редактиране/${id}/настройки`}
          variant="secondary"
          size="large"
          width="47%"
        >
          Назад
        </Button>

        <Button
          onClick={handleSave}
          variant="primary"
          width="47%"
          size="large"
          disabled={saving || isUnchanged}
        >
          {saving ? 'Запазване...' : 'Запази'}
        </Button>
      </div>
    </div>
  )
}
