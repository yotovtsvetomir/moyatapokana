import { NextResponse } from 'next/server'
import type { components } from '@/shared/types'

type PriceTier = components['schemas']['PriceTierRead'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ currency: string }> }
) {

  const { currency } = await params;

  try {
    const res = await fetch(`${process.env.API_URL_SERVER}/orders/price-tiers/${currency}`)

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'Failed to fetch price tiers', details: text },
        { status: res.status }
      )
    }

    const priceTiers: PriceTier[] = await res.json()
    return NextResponse.json(priceTiers)
  } catch (err) {
    console.error('Error fetching price tiers:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
