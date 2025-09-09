'use client'

import { useEffect, useState } from 'react'
import styles from './pricing.module.css'
import { components } from '@/shared/types'
import { Spinner } from '@/ui-components/Spinner/Spinner';
import ReactSelect, { Option } from '@/ui-components/Select/ReactSelect'

type PriceTier = components['schemas']['PriceTierRead']
type PriceTierResponse = components['schemas']['PriceTierReadWithChoices']

const formatDuration = (days: number) => {
  const daysInMonth = 30
  if (days < daysInMonth) return `${days} дни`
  const months = Math.floor(days / daysInMonth)
  return `${months} месец${months > 1 ? 'а' : ''}`
}

async function fetchTiers(currency: string): Promise<PriceTierResponse> {
  const url = new URL(`${process.env.NEXT_PUBLIC_CLIENT_URL}/api/orders/tiers/`)
  url.searchParams.append('currency', currency)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch price tiers')
  return res.json()
}

export default function PricingPage() {
  const [tiers, setTiers] = useState<PriceTier[]>([])
  const [currencies, setCurrencies] = useState<Option[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<Option>({ value: 'BGN', label: 'BGN' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTiers = async (currency: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTiers(currency)
      setTiers(data.tiers)
      setCurrencies(data.currencies.map(c => ({ value: c, label: c })))
    } catch (err) {
      console.error(err)
      setError('Грешка при зареждане на цените.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTiers(selectedCurrency.value)
  }, [selectedCurrency])

  return (
    <div className="container fullHeight centerWrapper">
      <h1 className={styles.title}>Цени</h1>

      {currencies.length > 1 && (
        <div className={styles.currencySelectWrapper}>
          <ReactSelect
            options={currencies}
            value={selectedCurrency}
            onChange={(option) => option && setSelectedCurrency(option)}
            placeholder="Избери валута"
            isClearable={false} // mandatory selection
          />
        </div>
      )}

      {loading && <Spinner />}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className={styles.tiersGrid}>
        {tiers.map((tier) => (
          <div key={tier.id} className={styles.tierCard}>
            <div className={styles.tierContent}>
              <h2>
                {tier.price.toFixed(2)} {tier.currency}
              </h2>
              <p>/</p>
              <p>{formatDuration(tier.duration_days)}</p>
            </div>

            <ul className={styles.tierFeatures}>
              <li>
                <span className="material-symbols-outlined">check</span>
                <p>Игра</p>
              </li>
              <li>
                <span className="material-symbols-outlined">check</span>
                <p>Анимация</p>
              </li>
              <li>
                <span className="material-symbols-outlined">check</span>
                <p>Покана</p>
              </li>
              <li>
                <span className="material-symbols-outlined">check</span>
                <p>Статистика</p>
              </li>
              <li>
                <span className="material-symbols-outlined">check</span>
                <p>Информация за гостите</p>
              </li>
              <li>
                <span className="material-symbols-outlined">check</span>
                <p>Линк за споделяне</p>
              </li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
