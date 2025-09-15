import SlideshowClient from './SlideshowClient'
import type { components } from '@/shared/types'

type SlideshowRead = components['schemas']['SlideshowRead']

async function getSlideshows(): Promise<SlideshowRead[]> {
  const res = await fetch(`${process.env.API_URL_SERVER}/invitations/slideshows`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function SlideshowPage() {
  const slideshows = await getSlideshows()

  return <SlideshowClient slideshows={slideshows} />
}
