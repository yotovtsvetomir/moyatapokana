'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { useInvitation } from '@/context/InvitationContext'
import { Button } from '@/ui-components/Button/Button'
import { Spinner } from '@/ui-components/Spinner/Spinner'

import styles from './music.module.css'

export default function MusicSettingsPage() {
  const { invitation, setInvitation } = useInvitation()
  const { id } = useParams()
  const router = useRouter()

  const [backgroundAudio, setBackgroundAudio] = useState<string | null>(null)
  const [localAudioPreview, setLocalAudioPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (invitation?.background_audio) {
      setBackgroundAudio(invitation.background_audio)
    }
  }, [invitation])

  if (!invitation) return <Spinner size={60} />

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile) {
      setFile(selectedFile)
      setLocalAudioPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleUpload = async (clear = false) => {
    setUploading(true);

    try {
      let res;
      if (clear) {
        // For deletion, send POST with no body (optional-file backend handles it)
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/invitations/upload-audio/${id}`,
          {
            method: "POST",
            credentials: "include",
          }
        );
      } else if (file) {
        const formData = new FormData();
        formData.append("audio", file);
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/invitations/upload-audio/${id}`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );
      } else {
        // Nothing to do
        setUploading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Неуспешно качване на музика");
      }

      const updated = await res.json();
      setInvitation(updated);
      setBackgroundAudio(updated.background_audio);
      setFile(null);
      setLocalAudioPreview(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Неуспешно качване");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container fullHeight centerWrapper steps">
      <div className={styles.music}>
        <h1>Фонова музика</h1>

        <div className={styles.audio}>
          {localAudioPreview ? (
            <audio
              key={localAudioPreview}
              controls
              src={localAudioPreview}
              style={{ width: '100%' }}
            />
          ) : backgroundAudio ? (
            <audio
              key={backgroundAudio}
              controls
              src={backgroundAudio}
              style={{ width: '100%' }}
            />
          ) : (
            <div className={styles.emptyPreview}>
              <span className="material-symbols-outlined">music_note</span>
            </div>
          )}
        </div>

        <label className={styles.uploadButton}>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            hidden
          />
          <span className="material-symbols-outlined">upload</span>
          <span>Качи аудио</span>
        </label>

        {backgroundAudio && (
          <Button
            variant="ghost"
            width="100%"
            onClick={() => handleUpload(true)}
            disabled={uploading}
          >
            Изтрий
          </Button>
        )}

        <div className={styles.actions}>
          <Button
            variant="ghost"
            onClick={() => router.push(`/покани/редактиране/${id}/настройки`)}
          >
            Назад
          </Button>

          <Button
            variant="primary"
            onClick={() => handleUpload(false)}
            disabled={!file || uploading}
          >
            {uploading ? 'Запазване...' : 'Запази музиката'}
          </Button>
        </div>
      </div>
    </div>
  )
}
