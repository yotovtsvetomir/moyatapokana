'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/ui-components/Button/Button";
import { Input } from "@/ui-components/Input/Input";
import RadioButton from "@/ui-components/RadioButton/RadioButton";
import ReactSelect from "@/ui-components/Select/ReactSelect";
import { components } from "@/shared/types";
import styles from "./checkout.module.css";

type Order = components['schemas']['OrderRead'];
type PriceTier = components['schemas']['PriceTierRead'];

type CurrencyOption = { value: string; label: string };
type TierOption = { value: string; label: string; duration_days: number };

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const formatDuration = (days: number) => {
  const daysInMonth = 30;
  if (days < daysInMonth) return { type: "days", value: days };
  return { type: "months", value: Math.floor(days / daysInMonth) };
};

const formatDateTime = (date: string | Date) => {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} г. ${hours}:${minutes} ч.`;
};

export default function CheckoutForm({ 
  order, 
  tiers, 
  currencies, 
  setOrder 
}: {
  order: Order; 
  tiers: PriceTier[]; 
  currencies: string[]; 
  setOrder: (o: Order) => void;
}) {
  const router = useRouter();
  const [isCompany, setIsCompany] = useState(order.is_company ?? false);
  const [companyName, setCompanyName] = useState(order.company_name ?? "");
  const [vatNumber, setVatNumber] = useState(order.vat_number ?? "");
  const [voucherCode, setVoucherCode] = useState(order.voucher_code ?? "");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [vatError, setVatError] = useState<string | null>(null);

  const [tierOptions, setTierOptions] = useState<TierOption[]>(() =>
    tiers.map(t => {
      const duration = formatDuration(t.duration_days);
      const durationLabel = duration.type === "days" 
        ? `${duration.value} дни`
        : `${duration.value} месец${duration.value > 1 ? "а" : ""}`;
      return { value: t.id.toString(), label: `${durationLabel} — ${t.price} ${t.currency}`, duration_days: t.duration_days };
    })
  );

  const [selectedTier, setSelectedTier] = useState<TierOption | null>(
    order.price_tier
      ? {
          value: order.price_tier.id.toString(),
          label: `${formatDuration(order.price_tier.duration_days).value} дни — ${order.price_tier.price} ${order.price_tier.currency}`,
          duration_days: order.price_tier.duration_days,
        }
      : null
  );

  const currencyOptions: CurrencyOption[] = currencies.map(c => ({ value: c, label: c }));

  // ------------------- Backend updater -------------------
  const updateOrderBackend = async (updates: Partial<{
    currency: string; duration_days: number; voucher_code: string | null; is_company: boolean; company_name: string; vat_number: string;
  }>) => {
    try {
      const payload = {
        currency: updates.currency ?? order.currency,
        duration_days: updates.duration_days ?? order.price_tier?.duration_days ?? null,
        voucher_code: 'voucher_code' in updates ? updates.voucher_code : order.voucher_code ?? null,
        is_company: 'is_company' in updates ? updates.is_company : order.is_company ?? false,
        company_name: 'company_name' in updates ? updates.company_name : order.company_name ?? "",
        vat_number: 'vat_number' in updates ? updates.vat_number : order.vat_number ?? ""
      };

      const res = await fetch(`${API_URL}/orders/update/${order.order_number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        setUpdateError(errData.detail || "Update failed");
        return;
      }

      const data = await res.json();
      setOrder(data.order);
      setUpdateError(null);
    } catch (err) {
      console.error(err);
      setUpdateError("Update failed");
    }
  };

  // ------------------- Handlers -------------------
  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const res = await fetch(`${API_URL}/orders/initiate-payment/${order.order_number}`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || "Неуспешно иницииране на плащането");
        return;
      }
      const data = await res.json();
      window.location.href = data.payment_url;
    } catch (err) {
      console.error(err);
      alert("Грешка при плащане");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCurrencyChange = async (opt: CurrencyOption | null) => {
    if (!opt) return;

    try {
      await updateOrderBackend({ currency: opt.value, duration_days: null, voucher_code: null });
      setSelectedTier(null);
      setVoucherCode('');

      const res = await fetch(`${API_URL}/orders/tiers/pricing?currency=${opt.value}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tiers");

      const data = await res.json();
      const tiersArray: PriceTier[] = Array.isArray(data.tiers) ? data.tiers : [];

      const newTierOptions: TierOption[] = tiersArray.map(t => {
        const duration = formatDuration(t.duration_days);
        const durationLabel =
          duration.type === "days"
            ? `${duration.value} дни`
            : `${duration.value} месец${duration.value > 1 ? "а" : ""}`;
        return { value: t.id.toString(), label: `${durationLabel} — ${t.price} ${t.currency}`, duration_days: t.duration_days };
      });

      setTierOptions(newTierOptions);

    } catch (err) {
      console.error(err);
    }
  };

  const handleTierChange = (opt: TierOption | null) => {
    if (!opt) return;
    updateOrderBackend({ duration_days: opt.duration_days });
  };

  const handleApplyVoucher = () => {
    if (!voucherCode) return;
    updateOrderBackend({ voucher_code: voucherCode });
  };

  const handleRemoveVoucher = () => {
    updateOrderBackend({ voucher_code: null });
    setVoucherCode('');
  };

  const handleVatChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setVatNumber(digitsOnly);

    if (digitsOnly.length > 0 && digitsOnly.length !== 9) {
      setVatError("Моля, въведете точно 9 цифри");
    } else {
      setVatError(null);
    }
  };

  const now = new Date();
  const durationDays = order.price_tier?.duration_days || 0;
  const until = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const isCompanyInfoChanged = order.is_company !== isCompany || order.company_name !== companyName || order.vat_number !== vatNumber;

  return (
    <div className="container fullHeight centerWrapper">
      <div className={styles.checkout}>
        <h1>Поръчка - {order.order_number}</h1>

        {order.invitation_wallpaper && (
          <div className={styles.inviteWrapper}>
            <div className={styles.imageWrapper}>
              <Image src={order.invitation_wallpaper} alt="Invitation" fill unoptimized className={styles.inviteImage} />
            </div>
          </div>
        )}

        <h2 className={styles.tierTitle}>Всеки план включва</h2>
        <div className={styles.tierInfo}>
          {['Поканата', 'Статистика', 'Информация за гостите', 'Линк за споделяне'].map((item, idx) => (
            <div key={idx}>
              <span className="material-symbols-outlined">check</span>
              <p>{item}</p>
            </div>
          ))}
        </div>

        <div className={styles.currencySelector}>
          <h2>Валута за плащане</h2>
          <ReactSelect
            options={currencyOptions}
            value={
              currencyOptions.find((c: CurrencyOption) => c.value === order.currency) ?? null
            }
            onChange={handleCurrencyChange}
            placeholder="Избери валута"
            isClearable={false}
            isSearchable={false}
          />
        </div>

        <div className={styles.selectWrapper}>
          <h2>План</h2>
          <ReactSelect<TierOption>
            options={tierOptions}
            value={selectedTier}
            onChange={(opt) => {
              setSelectedTier(opt);
              if (opt) handleTierChange(opt);
            }}
            placeholder="Моля, изберете план"
          />
          {order.price_tier && (
            <div className={styles.validityBox}>
              <h5>Поканата ще бъде активна</h5>
              <Input
                id="valid-from"
                name="valid-from"
                label="От"
                value={formatDateTime(now)}
                disabled
                onChange={() => {}}
              />
              <Input
                id="valid-until"
                name="valid-until"
                label="До"
                value={until ? formatDateTime(until) : ''}
                disabled
                onChange={() => {}}
              />
            </div>
          )}
        </div>

        <div className={styles.companySection}>
          <h2>Фактуриране</h2>

          <div className={styles.radioGroup}>
            <RadioButton
              label="Физическо лице"
              name="company-status"
              value="individual"
              selected={!isCompany}
              onSelect={() => {
                setIsCompany(false);
                setCompanyName('');
                setVatNumber('');
                setVatError(null);

                updateOrderBackend({
                  is_company: false,
                  company_name: '',
                  vat_number: '',
                });
              }}
            />
            <RadioButton
              label="Фирма"
              name="company-status"
              value="company"
              selected={isCompany}
              onSelect={() => setIsCompany(true)}
            />
          </div>

          {isCompany && (
            <>
              <Input
                id="company-name"
                name="company-name"
                label="Фирма"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
              />
              <Input
                id="vat-number"
                name="vat-number"
                label="ЕИК/ПИК/БУЛСТАТ"
                value={vatNumber}
                error={vatError}
                onChange={e => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  setVatNumber(digitsOnly);

                  if (digitsOnly.length > 0 && digitsOnly.length !== 9) {
                    setVatError('Моля, въведете точно 9 цифри');
                  } else {
                    setVatError(null);
                  }
                }}
              />
              <Button
                size="large"
                width="100%"
                variant="primary"
                disabled={!isCompanyInfoChanged || vatNumber.length !== 9} // disable if not changed or invalid VAT
                onClick={() =>
                  updateOrderBackend({
                    is_company: isCompany,
                    company_name: companyName,
                    vat_number: vatNumber,
                  })
                }
              >
                Потвърди фирмена информация
              </Button>
            </>
          )}
        </div>

        <div className={styles.voucherWrapper}>
          <h2>Промо код</h2>
          <Input id="voucher" name="voucher" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {!order.voucher_code && (
              <Button
                size="large"
                width="100%"
                variant="primary"
                onClick={handleApplyVoucher}
                disabled={!voucherCode}
              >
                Приложи
              </Button>
            )}
            
            {order.voucher_code && (
              <Button
                size="large"
                width="100%"
                variant="secondary"
                onClick={handleRemoveVoucher}
              >
                Премахни
              </Button>
            )}
          </div>
        </div>

        {updateError && <p className={styles.error}>{updateError}</p>}

        <div className={styles.summary}>
          <h2>Общо</h2>
          <div className={styles.summaryRow}>
            <p>Цена:</p>
            <p>{order.original_price?.toFixed(2) ?? '0.00'} {order.currency}</p>
          </div>
          {order.voucher_code && (
            <div className={styles.summaryRow} style={{ color: '#298267' }}>
              <p>Отстъпка:</p>
              <p>
                {order.voucher_code.length > 4
                  ? order.voucher_code.slice(0, 4) + '…'
                  : order.voucher_code}{' '}
                -{order.discount_amount?.toFixed(2)} {order.currency}
              </p>
            </div>
          )}
          <div className={styles.summaryRow}>
            <p><strong>Крайна цена:</strong></p>
            <p><strong>{order.total_price?.toFixed(2) ?? '0.00'} {order.currency}</strong></p>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            onClick={handleCheckout}
            disabled={!order.price_tier || checkoutLoading}
            width="100%"
            icon="payments"
            iconPosition="right"
            size="large"
          >
            {checkoutLoading ? 'Обработване...' : 'Плати'}
          </Button>
        </div>
      </div>
    </div>
  );
}
