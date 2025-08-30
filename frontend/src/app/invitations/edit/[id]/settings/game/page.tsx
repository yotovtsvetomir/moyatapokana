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

type GameRead = components['schemas']['GameRead']

const toOption = (game: GameRead): Option => ({
  label: game.name,
  value: game.key,
  id: game.id,
})

export default function GameSettingsPage() {
  const { invitation, setInvitation } = useInvitation()
  const { id } = useParams()

  const [games, setGames] = useState<GameRead[]>([])
  const [selectedGame, setSelectedGame] = useState<Option | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/invitations/games', { credentials: 'include' })
        const data = await res.json()
        setGames(data)

      } catch (err) {
        console.error('Неуспешно зареждане на игрите', err)
        setGames([])
      }
    }

    fetchGames()
  }, [])

  useEffect(() => {
    if (invitation?.selected_game) {
      const match = games.find((g) => g.key === invitation.selected_game)
      if (match) setSelectedGame(toOption(match))
    }
  }, [invitation, games])

  if (!invitation) return <Spinner size={60} />

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/invitations/update/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_game: selectedGame?.value || null,
        }),
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Неуспешно запазване на играта')
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

  const isUnchanged =
    (invitation?.selected_game || null) === (selectedGame?.value || null)

  return (
    <div className="container fullHeight centerWrapper steps">
      <h1>Избор на игра за покана #{invitation.id}</h1>

      <ReactSelect
        options={[{ label: 'Без', value: '' }, ...games.map(toOption)]}
        value={selectedGame || { label: 'Без', value: '' }}
        onChange={(opt) => {
          setSelectedGame(opt && opt.value ? opt : null)
        }}
        placeholder="Избери игра"
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
