'use client'

import { useParams } from 'next/navigation'
import { Button } from '@/ui-components/Button/Button'

import styles from './preview.module.css'

export default function InvitationCustomizePage() {
  const { id } = useParams()

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

        <div className={styles.buttons}>
          <Button
            href={`/invitations/preview/${id}`}
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
