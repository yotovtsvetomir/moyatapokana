import { NextResponse } from 'next/server'
import type { components } from '@/shared/types'

type FontRead = components['schemas']['FontRead']

export async function GET() {
  try {
    const res = await fetch(`${process.env.API_URL_SERVER}/invitations/fonts`)

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'Failed to fetch fonts', details: text },
        { status: res.status }
      )
    }

    const fonts: FontRead[] = await res.json()
    return NextResponse.json(fonts)
  } catch (err) {
    console.error('Error fetching fonts:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
