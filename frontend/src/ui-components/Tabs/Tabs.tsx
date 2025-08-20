'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Tabs.module.css'

interface Tab {
  key: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  basePath: string
}

export default function Tabs({ tabs, basePath }: TabsProps) {
  const pathname = usePathname()
  const [show, setShow] = useState(true)

  useEffect(() => {
    let lastScroll = 0

    const handleScroll = () => {
      const currentScroll = window.scrollY
      const isMobile = window.innerWidth < 1024

      if (!isMobile) return

      setShow(currentScroll <= lastScroll || currentScroll < 50)
      lastScroll = currentScroll
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isPreview = pathname.endsWith('/preview')
  const currentTab = tabs.find((tab) => pathname.includes(`/${tab.key}`))
  const currentIndex = isPreview
    ? tabs.length - 1
    : currentTab
    ? tabs.findIndex((t) => t.key === currentTab.key)
    : 0

  // Sliding window logic: show current + next 2
  let start = Math.max(0, currentIndex - 1)
  if (start + 3 > tabs.length) {
    start = Math.max(0, tabs.length - 3)
  }
  const visibleTabs = tabs.slice(start, start + 3)

  return (
    <div className={`${styles.stepper} ${!show ? styles.hidden : ''}`}>
      <div className={styles.stepperContainer}>
        {visibleTabs.map((tab, index) => {
          const realIndex = start + index
          const href = `${basePath}/${tab.key}`
          const isCompleted = isPreview || realIndex < currentIndex
          const isCurrent = !isPreview && currentTab?.key === tab.key

          const circleClass = isCompleted
            ? styles.completed
            : isCurrent
            ? styles.active
            : styles.future

          return (
            <div className={styles.stepWrapper} key={tab.key}>
              {index < visibleTabs.length - 1 && (
                <div className={`${styles.connectorLine} ${isCompleted ? styles.filled : ''}`} />
              )}
              <Link href={href} className={styles.step}>
                <div className={`${styles.circle} ${circleClass}`}>
                  {isCompleted ? <span className="material-symbols-outlined">check</span> : realIndex + 1}
                </div>
                <div className={styles.label}>{tab.label}</div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
