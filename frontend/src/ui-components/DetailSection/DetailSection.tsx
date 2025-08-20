'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button/Button'
import styles from './DetailSection.module.css'

type Props = {
  children: React.ReactNode
  onSave: () => Promise<boolean>
  backHref: string
}

export default function DetailSection({ children, onSave, backHref }: Props) {
  const router = useRouter()

  const handleBack = () => {
    router.push(backHref)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  const handleSave = async () => {
    const success = await onSave()
    if (success) router.push(backHref)
  }

  return (
    <div className={styles.detailSection}>
      {children}
      <div className={styles.editActions}>
        <Button variant="ghost" onClick={handleBack}>
          Назад
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Запази
        </Button>
      </div>
    </div>
  )
}
