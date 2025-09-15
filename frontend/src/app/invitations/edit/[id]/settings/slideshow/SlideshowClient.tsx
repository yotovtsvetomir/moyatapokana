'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useInvitation } from '@/context/InvitationContext'
import { Button } from '@/ui-components/Button/Button'
import { Spinner } from '@/ui-components/Spinner/Spinner'
import Modal from '@/ui-components/Modal/Modal'
import ReactSelect, { type Option } from '@/ui-components/Select/ReactSelect'
import type { components } from '@/shared/types'
import styles from './Slideshow.module.css'

type SlideshowRead = components["schemas"]["SlideshowRead"]
type SlideshowImageRead = components["schemas"]["SlideshowImageRead"]

type SlideState = { file?: File; file_url?: string }

interface Props {
  slideshows: SlideshowRead[]
}

const MAX_SLIDES = 5

export default function SlideshowClient({ slideshows }: Props) {
  const { id } = useParams()
  const router = useRouter()
  const { invitation, setInvitation } = useInvitation()

  const [selectedSlideshow, setSelectedSlideshow] = useState<Option | null | undefined>(null)
  const [slides, setSlides] = useState<SlideState[]>(Array(MAX_SLIDES).fill({}))
  const [previews, setPreviews] = useState<(string | null)[]>(Array(MAX_SLIDES).fill(null))
  const [loading, setLoading] = useState(false)
  const [showBackModal, setShowBackModal] = useState(false)
  const [showOverwriteModal, setShowOverwriteModal] = useState(false)

  const toOption = (s: SlideshowRead): Option => ({
    label: s.name,
    value: s.id.toString(),
    key: s.key,
    id: s.id,
    presentationImage: s.presentation_image
  })

  const totalSlides = slides.filter(s => s.file || s.file_url).length
  const hasNewFiles = slides.some(s => s.file)

  const currentKey = selectedSlideshow?.key
  const originalKey = invitation?.selected_slideshow
  const animationChanged = currentKey !== originalKey

  // -------------------- Initialize slides & selected slideshow --------------------
  useEffect(() => {
    if (!invitation || slideshows.length === 0) return

    const imgs: SlideshowImageRead[] = invitation.slideshow_images.slice(0, MAX_SLIDES)
    const newSlides: SlideState[] = [
      ...imgs.map(s => ({ file_url: s.file_url })),
      ...Array(MAX_SLIDES - imgs.length).fill({})
    ]
    setSlides(newSlides)
    setPreviews(newSlides.map(s => s.file_url || null))

    if (invitation.selected_slideshow) {
      const match = slideshows.find(s => s.key === invitation.selected_slideshow)
      setSelectedSlideshow(match ? toOption(match) : { label: 'Без', value: '' })
    } else {
      setSelectedSlideshow({ label: 'Без', value: '' })
    }
  }, [invitation, slideshows])

  const handleAddFiles = (files: FileList) => {
    const nextSlides = [...slides]
    const nextPreviews = [...previews]
    let index = 0
    while (index < MAX_SLIDES && (nextSlides[index].file || nextSlides[index].file_url)) index++
    Array.from(files).forEach(f => {
      if (index < MAX_SLIDES) {
        nextSlides[index] = { file: f }
        nextPreviews[index] = URL.createObjectURL(f)
        index++
      }
    })
    setSlides(nextSlides)
    setPreviews(nextPreviews)
  }

  const handleDelete = (i: number) => {
    const nextSlides = [...slides]
    const nextPreviews = [...previews]
    nextSlides[i] = {}
    nextPreviews[i] = null
    setSlides(nextSlides)
    setPreviews(nextPreviews)
  }

  const handleSave = async () => {
    if (!invitation) return

    if (selectedSlideshow?.value && totalSlides !== MAX_SLIDES) {
      alert(`Трябва да качите точно ${MAX_SLIDES} изображения.`)
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()

      // Append only new files
      slides.forEach(s => s.file && formData.append("slides", s.file))

      // Send existing slides URLs (or null) — always required
      const existingSlidesToSend = slides.map(s => s.file_url || null)
      formData.append("existing_slides", JSON.stringify(existingSlidesToSend))

      // Always send selected_slideshow — ensures animation changes are saved
      formData.append("selected_slideshow", selectedSlideshow?.value || "")

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/slides/${id}`, {
        method: "POST",
        body: formData,
        credentials: "include"
      })

      const data = (await res.json()) as { slideshow_images: SlideshowImageRead[] }
      if (!res.ok) throw data

      // Update slides & previews
      const newSlides: SlideState[] = [
        ...data.slideshow_images.slice(0, MAX_SLIDES).map(s => ({ file_url: s.file_url })),
        ...Array(MAX_SLIDES - data.slideshow_images.length).fill({})
      ]
      setSlides(newSlides)
      setPreviews(newSlides.map(s => s.file_url || null))

      // Merge updated slides into existing invitation
      setInvitation({
        ...invitation,
        slideshow_images: data.slideshow_images
      })
    } catch (err) {
      console.error(err)
      alert("Неуспешно записване на слайдове")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (!invitation) return
    const hasUnsaved = slides.some((s, i) => {
      const orig = invitation.slideshow_images[i]
      return (s.file && !orig) || (!s.file && !s.file_url && orig)
    })
    if (hasUnsaved) setShowBackModal(true)
    else router.back()
  }

  const confirmBack = () => { setShowBackModal(false); router.push(`/invitations/edit/${id}/effects/`) }
  const cancelBack = () => setShowBackModal(false)
  const confirmOverwrite = () => { setShowOverwriteModal(false); setSelectedSlideshow(null) }
  const cancelOverwrite = () => setShowOverwriteModal(false)

  if (!invitation) return <Spinner size={60} />

  return (
    <div className="container fullHeight centerWrapper steps">
      <h1>Качи слайдове за покана #{invitation.id}</h1>

      <ReactSelect
        options={[{ label: 'Без', value: '' }, ...slideshows.map(toOption)]}
        value={selectedSlideshow || { label: 'Без', value: '' }}
        onChange={setSelectedSlideshow}
        placeholder="Избери слайдшоу"
      />

      {selectedSlideshow && selectedSlideshow.label !== 'Без' &&
        <div className="presentImageSlideshow">
          <Image
            src={selectedSlideshow.presentationImage || '/placeholder.png'}
            alt="Wallpaper Preview"
            fill
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        </div>
      }

      {selectedSlideshow && selectedSlideshow.value !== '' && (
        <div className={styles.slidesContainer}>
          {slides.map((s, i) => (
            <div key={i} className={styles.slideCard}>
              {s.file_url || s.file ? (
                <>
                  {s.file_url ? (
                    <Image src={s.file_url} alt={`Slide ${i + 1}`} fill style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <Image src={previews[i]!} alt={`Slide ${i + 1}`} fill style={{ objectFit: 'cover' }} unoptimized />
                  )}
                  <button onClick={() => handleDelete(i)} className={styles.deleteButton}>✕</button>
                </>
              ) : (
                <label className={styles.addLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40 }}>add_a_photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => e.target.files && handleAddFiles(e.target.files)}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.editActions}>
        <Button variant="secondary" size="large" onClick={handleBack}>Назад</Button>
        <Button
          variant="primary"
          size="large"
          onClick={handleSave}
          disabled={
            loading ||
            (selectedSlideshow?.value !== '' && (totalSlides !== MAX_SLIDES || !hasNewFiles)) &&
            !animationChanged
          }
        >
          {loading ? 'Запазване...' : 'Запази'}
        </Button>
      </div>

      {loading && <Spinner size={40} />}

      {showBackModal && (
        <Modal
          title="Незавършено качване"
          description="Имате незапазени промени. Ако се върнете, те ще бъдат загубени."
          confirmText="Продължи"
          cancelText="Отказ"
          onConfirm={confirmBack}
          onCancel={cancelBack}
          danger
        />
      )}

      {showOverwriteModal && (
        <Modal
          title="Слайдшоу ще бъде изчистено"
          description="Нямате качени изображения. Слайдшоуто ще се запише като 'Без'."
          confirmText="Продължи"
          cancelText="Отказ"
          onConfirm={confirmOverwrite}
          onCancel={cancelOverwrite}
          danger
        />
      )}
    </div>
  )
}
