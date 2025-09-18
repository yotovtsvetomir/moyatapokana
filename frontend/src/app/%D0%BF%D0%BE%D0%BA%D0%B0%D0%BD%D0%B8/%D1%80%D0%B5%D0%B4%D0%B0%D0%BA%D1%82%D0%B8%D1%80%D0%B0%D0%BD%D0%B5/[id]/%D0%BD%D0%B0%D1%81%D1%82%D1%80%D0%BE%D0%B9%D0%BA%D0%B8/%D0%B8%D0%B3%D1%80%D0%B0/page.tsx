import GameSettingsClient from './GameSettingsClient'
import type { components } from '@/shared/types'

type GameRead = components['schemas']['GameRead']

async function getGames(): Promise<GameRead[]> {
  const res = await fetch(`${process.env.API_URL_SERVER}/invitations/games`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function GameSettingsPage() {
  const games = await getGames()

  return <GameSettingsClient games={games} />
}
