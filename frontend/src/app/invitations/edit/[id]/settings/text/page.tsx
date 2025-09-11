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
  const { invitation, updateInvitation } = useInvitation()
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
      await updateInvitation({ title, description, extra_info: extraInfo })
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Неуспешно запазване на текста')
    } finally {
      setSaving(false)
    }
  }

  const isUnchanged =
    title === (invitation?.title || '') &&
    description === (invitation?.description || '') &&
    extraInfo === (invitation?.extra_info || '')

  return (
    <div className="container fullHeight centerWrapper steps" style={{ paddingBottom: "3rem"}}>
      <h1>Редакция на текста #{invitation.id}</h1>

      <Input
        id="title"
        name="title"
        label="Заглавие"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="large"
        required
        hint={"Препоръчваме до 64 символа.\nПример:\n Заповядайте на първият рожден ден на Кати"}
      />

      <Textarea
        id="description"
        name="description"
        label="Описание"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        size="large"
        hint={`Препоръчваме до 4 абзаца общо, до 7-8 изречения.\nПример:\nСкъпи приятели,\n\nС огромна радост ви каним да отпразнуваме заедно първия рожден ден на нашата малка принцеса Катерина!\n\nТова е един много специален момент за нас и ще бъде истинско щастие да го споделим с най-близките си хора.\n\nНадяваме се да бъдете част от този незабравим празник и да зарадвате Кати с вашето присъствие.`}
      />

      <Textarea
        id="extraInfo"
        name="extraInfo"
        label="Допълнителна информация"
        value={extraInfo}
        onChange={(e) => setExtraInfo(e.target.value)}
        size="large"
        hint={"Препоръчваме да поставяте на нов ред отделните неща.\nПример:\nДрес код: официален\n\nМоля, потвърдете присъствието си до 1 юни.\n\nВместо цветя: ще има касичка за дарения, които ще бъдат предоставени за благотворителна кауза"}
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
          disabled={saving || isUnchanged}
        >
          {saving ? 'Запазване...' : 'Запази'}
        </Button>
      </div>
    </div>
  )
}
