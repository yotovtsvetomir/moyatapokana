import FontSettingsClient from './FontSettingsClient'
import type { components } from '@/shared/types'

type FontRead = components['schemas']['FontRead']

async function getFonts(): Promise<FontRead[]> {
  const res = await fetch(`${process.env.API_URL_SERVER}/invitations/fonts`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function FontSettingsPage() {
  const fonts = await getFonts()

  return <FontSettingsClient fonts={fonts} />
}
