"use client";

import { useEffect, useState } from "react";
import styles from "./pricing.module.css";
import { components } from "@/shared/types";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import ReactSelect, { Option } from "@/ui-components/Select/ReactSelect";

type PriceTier = components["schemas"]["PriceTierRead"];
type PriceTierResponse = components["schemas"]["PriceTierReadWithChoices"];

const formatDuration = (days: number) => {
  const daysInMonth = 30;
  if (days < daysInMonth) return `${days} дни`;
  const months = Math.floor(days / daysInMonth);
  return `${months} месец${months > 1 ? "а" : ""}`;
};

async function fetchTiers(currency: string): Promise<PriceTierResponse> {
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/orders/tiers/pricing`);
  url.searchParams.append("currency", currency);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch price tiers");
  return res.json();
}

interface Props {
  initialTiers: PriceTier[];
  initialCurrencies: string[];
}

export default function PricingClient({ initialTiers, initialCurrencies }: Props) {
  const [tiers, setTiers] = useState<PriceTier[]>(initialTiers);
  const [currencies, setCurrencies] = useState<Option[]>(
    initialCurrencies.map((c) => ({ value: c, label: c }))
  );

  const [selectedCurrency, setSelectedCurrency] = useState<Option>(
    currencies[0] || { value: "BGN", label: "BGN" }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTiers = async (currency: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTiers(currency);

      // Ensure we always get arrays
      const fetchedTiers = Array.isArray(data.tiers) ? data.tiers : [];
      const fetchedCurrencies = Array.isArray(data.currencies) ? data.currencies : [];

      setTiers(fetchedTiers);
      setCurrencies(fetchedCurrencies.map((c) => ({ value: c, label: c })));

      // Automatically select the first currency in the new list if it changed
      if (!fetchedCurrencies.includes(selectedCurrency.value)) {
        setSelectedCurrency({ value: fetchedCurrencies[0], label: fetchedCurrencies[0] });
      }
    } catch (err) {
      console.error(err);
      setError("Грешка при зареждане на цените.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load tiers whenever the selected currency changes
  useEffect(() => {
    if (selectedCurrency?.value) {
      loadTiers(selectedCurrency.value);
    }
  }, [selectedCurrency]);

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
            isClearable={false}
          />
        </div>
      )}

      {loading && <Spinner />}
      {error && <p style={{ color: "red" }}>{error}</p>}

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
              {["Игра", "Анимация", "Покана", "Статистика", "Информация за гостите", "Линк за споделяне"].map((feature, idx) => (
                <li key={idx}>
                  <span className="material-symbols-outlined">check</span>
                  <p>{feature}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
