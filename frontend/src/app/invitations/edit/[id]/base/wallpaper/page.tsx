'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useInvitation } from '@/context/InvitationContext'

import { Button } from '@/ui-components/Button/Button'
import { Spinner } from '@/ui-components/Spinner/Spinner'

export default function WallpaperSettingsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { invitation, setInvitation } = useInvitation()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(invitation?.wallpaper || '')
  const [loading, setLoading] = useState(false)

  if (!invitation) return <Spinner size={60} />

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)

    const formData = new FormData()
    formData.append('wallpaper', file)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invitations/wallpaper/${id}`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      )

      const data = await res.json()
      if (!res.ok) {
        console.error('Wallpaper upload failed', data)
        alert(data.detail || 'Неуспешно качване на тапет')
        return
      }

      setInvitation(data)
      setPreview(data.wallpaper)
      setFile(null)
    } catch (err) {
      console.error('Wallpaper upload failed', err)
      alert('Неуспешно качване на тапет')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container fullHeight centerWrapper">
      <h1>Редакция на тапета #{invitation.id}</h1>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 800,
          height: 400,
          margin: '2rem auto',
          borderRadius: 12,
          overflow: 'hidden',
          border: '2px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9f9f9',
          color: '#aaa',
          fontSize: 80,
        }}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Wallpaper Preview"
            fill
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: "3rem" }}>photo</span>
        )}
      </div>

      <label className="uploadButton">
        <input
          id="wallpaper"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          hidden
        />
        <span className="material-symbols-outlined">add_a_photo</span>
        <span>Качи снимка</span>
      </label>

      <div className="editActions">
        <Button
          variant="secondary"
          size="large"
          onClick={() => router.back()}
        >
          Назад
        </Button>

        <Button
          onClick={handleUpload}
          variant="primary"
          size="large"
          disabled={!file || loading}
        >
          {loading ? 'Запазване...' : 'Запази'}
        </Button>
      </div>
    </div>
  )
}
