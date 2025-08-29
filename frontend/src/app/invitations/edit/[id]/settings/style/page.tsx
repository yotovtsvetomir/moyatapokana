'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import { useInvitation } from '@/context/InvitationContext'
import { Button } from '@/ui-components/Button/Button'
import ColorPicker from '@/ui-components/ColorPicker/ColorPicker'
import { Spinner } from '@/ui-components/Spinner/Spinner'

export default function StylingSettingsPage() {
  const { invitation, setInvitation } = useInvitation()
  const { id } = useParams()

  const [primaryColor, setPrimaryColor] = useState('#ffffff')
  const [secondaryColor, setSecondaryColor] = useState('#000000')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (invitation) {
      setPrimaryColor(invitation.primary_color || '#ffffff')
      setSecondaryColor(invitation.secondary_color || '#000000')
    }
  }, [invitation])

  if (!invitation) return <Spinner size={60} />

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/invitations/update/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ primary_color: primaryColor, secondary_color: secondaryColor })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Неуспешно запазване на цветовете')
      }

      setInvitation(data)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Неуспешно запазване на цветовете')
    } finally {
      setSaving(false)
    }
  }

  const isUnchanged =
    primaryColor === (invitation?.primary_color || '#ffffff') &&
    secondaryColor === (invitation?.secondary_color || '#000000')

  return (
    <div className="container fullHeight centerWrapper">
      <h1>Настройки на цветовете #{invitation.id}</h1>

      <div style={{ marginBottom: '2rem', width: '100%' }}>
        <label>Основен цвят</label>
        <ColorPicker color={primaryColor} onChange={setPrimaryColor} />
      </div>

      <div style={{ marginBottom: '2rem', width: '100%' }}>
        <label>Допълнителен цвят</label>
        <ColorPicker color={secondaryColor} onChange={setSecondaryColor} />
      </div>

      <div className="editActions">
        <Link href={`/invitations/edit/${id}/settings`} style={{ width: '47%' }}>
          <Button variant="secondary" size="large" width="100%">
            Назад
          </Button>
        </Link>

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
