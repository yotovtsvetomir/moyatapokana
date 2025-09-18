'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

import { useInvitation } from '@/context/InvitationContext'
import { Button } from '@/ui-components/Button/Button'
import { Spinner } from '@/ui-components/Spinner/Spinner'
import ReactSelect, { type Option } from '@/ui-components/Select/ReactSelect'
import type { components } from '@/shared/types'

type GameRead = components['schemas']['GameRead']

interface Props {
  games: GameRead[]
}

const toOption = (game: GameRead): Option => ({
  label: game.name,
  value: game.key,
  id: game.id,
  presentationImage: game.presentation_image
})

export default function GameSettingsClient({ games }: Props) {
  const { invitation, updateInvitation } = useInvitation()
  const { id } = useParams()
  const [selectedGame, setSelectedGame] = useState<Option | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (invitation?.selected_game) {
      const match = games.find((g) => g.key === invitation.selected_game)
      if (match) setSelectedGame(toOption(match))
    }
  }, [invitation, games])

  if (!invitation) return <Spinner size={60} />

  const handleSave = async () => {
    if (!selectedGame) return
    setSaving(true)
    try {
      await updateInvitation({ selected_game: selectedGame.value })
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Неуспешно запазване')
    } finally {
      setSaving(false)
    }
  }

  const isUnchanged = (invitation?.selected_game || null) === (selectedGame?.value || null)

  return (
    <div className="container fullHeight centerWrapper steps">
      <h1>Избор на игра за покана #{invitation.id}</h1>

      <ReactSelect
        options={[{ label: 'Без', value: '' }, ...games.map(toOption)]}
        value={selectedGame || { label: 'Без', value: '' }}
        onChange={(opt) => setSelectedGame(opt && opt.value ? opt : null)}
        placeholder="Избери игра"
      />

      {selectedGame && selectedGame.presentationImage && (
        <div className="presentImage">
          <Image
            src={selectedGame.presentationImage}
            alt="Wallpaper Preview"
            fill
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        </div>
      )}

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
