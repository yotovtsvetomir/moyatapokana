'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/ui-components/Button/Button'
import { useInvitation } from "@/context/InvitationContext";
import styles from './preview.module.css'

export default function InvitationCustomizePage() {
  const { id } = useParams()
  const router = useRouter()
  const { invitation } = useInvitation();
  const [error, setError] = useState<string | null>(null)

  const handleVisualize = () => {
    if (!invitation?.title || invitation.title.trim() === "") {
      setError("Моля, въведете заглавие за поканата, за да продължите.");
      return;
    }

    setError(null);
    localStorage.setItem("replay", "true");
    router.push(`/покани/преглед/${invitation.slug}`);
  };

  return (
    <div className="container fullHeight centerWrapper steps">
      <div className={styles.preview}>
        <h1>Покана #{id} - Визуализация</h1>

        <div className={styles.info}>
          <span className="material-symbols-outlined">done_all</span>
          <p>Страхотно! Настройките и събитията ви са готови.</p>
        </div>

        <div className={styles.info}>
          <span className="material-symbols-outlined">celebration</span>
          <p>Време е да видите как изглежда поканата ви!</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.buttons}>
          <Button
            onClick={handleVisualize}
            variant="primary"
            size="large"
            width="100%"
            icon="visibility"
            iconPosition="right"
          >
            Визуализирай
          </Button>
        </div>
      </div>
    </div>
  )
}
