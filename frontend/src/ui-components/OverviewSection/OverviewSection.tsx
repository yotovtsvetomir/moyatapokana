'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import styles from './OverviewSection.module.css'

type Props = {
  href: string
  title: string
  value?: string
  subtitle?: string
  children?: React.ReactNode
  last?: boolean
}

export default function OverviewSection({
  href,
  title,
  value,
  subtitle,
  children,
  last = false
}: Props) {
  const router = useRouter()
  const sectionClassName = `${styles.section}${last ? ' ' + styles.last : ''}`

  const handleClick = () => {
    router.push(href)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  return (
    <div onClick={handleClick} className={sectionClassName} role="button" tabIndex={0}>
      <div className={styles.sectionContent}>
        <div>
          <h4>{title}</h4>

          <div className={styles.sectionInner}>
            {value && value.match(/\.(jpe?g|png|webp|gif)$/i) ? (
              <div className={styles.imageWrapper}>
                <Image
                  src={value}
                  alt="Преглед на тапета"
                  width={64}
                  height={64}
                  className={styles.imagePreview}
                  unoptimized
                />
              </div>
            ) : (
              <p>{value}</p>
            )}
            {children}
          </div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <span className="material-symbols-outlined">chevron_right</span>
      </div>
    </div>
  )
}
