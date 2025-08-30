'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import { useInvitation } from '@/context/InvitationContext'

import { Button } from '@/ui-components/Button/Button'
import { Input } from '@/ui-components/Input/Input'
import { Textarea } from '@/ui-components/Input/Textarea'
import { Spinner } from '@/ui-components/Spinner/Spinner'

export default function TextSettingsPage() {
  const { invitation, setInvitation } = useInvitation()
  const { id } = useParams()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [extraInfo, setExtraInfo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (invitation) {
      setTitle(invitation.title || '')
      setDescription(invitation.description || '')
      setExtraInfo(invitation.extra_info || '')
    }
  }, [invitation])

  if (!invitation) return <Spinner size={60} />

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/invitations/update/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, extra_info: extraInfo }),
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Неуспешно запазване на текста')
      }

      const updated = await res.json()
      setInvitation(updated)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Неуспешно запазване на текста')
    } finally {
      setSaving(false)
    }
  }

  // Disable save if nothing changed
  const isUnchanged =
    title === (invitation?.title || '') &&
    description === (invitation?.description || '') &&
    extraInfo === (invitation?.extra_info || '')

  return (
    <div className="container fullHeight centerWrapper steps">
      <h1>Редакция на текста #{invitation.id}</h1>

      <Input
        id="title"
        name="title"
        label="Заглавие"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="large"
        required
      />

      <Textarea
        id="description"
        name="description"
        label="Описание"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        size="large"
      />

      <Textarea
        id="extraInfo"
        name="extraInfo"
        label="Допълнителна информация"
        value={extraInfo}
        onChange={(e) => setExtraInfo(e.target.value)}
        size="large"
      />

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
          disabled={saving || isUnchanged} // disabled if nothing changed
        >
          {saving ? 'Запазване...' : 'Запази'}
        </Button>
      </div>
    </div>
  )
}
