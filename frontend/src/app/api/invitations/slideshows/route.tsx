import { NextResponse } from 'next/server'
import type { components } from '@/shared/types'

type SlideshowRead = components['schemas']['GameRead']

export async function GET() {
  try {
    const res = await fetch(`${process.env.API_URL_SERVER}/invitations/slideshows`)

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'Failed to fetch games', details: text },
        { status: res.status }
      )
    }

    const games: SlideshowRead[] = await res.json()
    return NextResponse.json(games)
  } catch (err) {
    console.error('Error fetching games:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
