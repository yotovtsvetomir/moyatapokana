'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import ReactSelect from '@/ui-components/Select/ReactSelect';
import { components } from '@/shared/types';
import styles from './checkout.module.css';

type Order = components['schemas']['OrderRead'];
type PriceTier = components['schemas']['PriceTierRead'];

type CurrencyOption = { value: string; label: string };
type TierOption = { value: string; label: string; duration_days: number };

const formatDuration = (days: number) => {
  const daysInMonth = 30;
  if (days < daysInMonth) {
    return { type: 'days', value: days };
  } else {
    const months = Math.floor(days / daysInMonth);
    return { type: 'months', value: months };
  }
};

const formatDateTime = (date: string | Date) => {
  const d = date instanceof Date ? date : new Date(date);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} г. ${hours}:${minutes} ч.`;
};

export default function CheckoutPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [tierOptions, setTierOptions] = useState<TierOption[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [ checkoutLoading, setCheckoutLoading ] = useState(false)

  // ---------------- Fetch order + tiers ----------------
  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitation_id: Number(id) }),
        });

        if (!res.ok) {
          console.error('Failed to fetch order');
          return;
        }

        const data: { order: Order; tiers: PriceTier[]; currencies: string[] } = await res.json();

        setOrder(data.order);

        setCurrencyOptions(data.currencies.map(c => ({ value: c, label: c })));
        setTierOptions(
          data.tiers.map(t => {
            const duration = formatDuration(t.duration_days);

            let durationLabel: string;
            if (duration.type === 'days') {
              durationLabel = `${duration.value} дни`;
            } else {
              durationLabel = `${duration.value} месец${duration.value > 1 ? 'а' : ''}`;
            }

            return {
              value: t.id.toString(),
              label: `${durationLabel} — ${t.price} ${t.currency}`,
              duration_days: t.duration_days,
            };
          })
        );

        setVoucherCode(data.order.voucher_code ?? '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // ---------------- Update order ----------------
  const updateOrderBackend = async (updates: {
    currency?: string;
    duration_days?: number | null;
    voucher_code?: string | null;
  }) => {
    if (!order) return;

    const payload = {
      currency: updates.currency?.toUpperCase() ?? order.currency,
      duration_days: updates.duration_days ?? order.duration_days ?? null,
      voucher_code: 'voucher_code' in updates ? updates.voucher_code : order.voucher_code ?? null,
    };

    try {
      const res = await fetch(`/api/orders/update/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        setUpdateError(errData.detail || 'Update failed');
        return;
      }

      const data = await res.json();
      setOrder(data.order);
      setCurrencyOptions(data.currencies.map(c => ({ value: c, label: c })));
      setTierOptions(
        data.tiers.map(t => {
          const duration = formatDuration(t.duration_days);

          let durationLabel: string;
          if (duration.type === 'days') {
            durationLabel = `${duration.value} дни`;
          } else {
            durationLabel = `${duration.value} месец${duration.value > 1 ? 'а' : ''}`;
          }

          return {
            value: t.id.toString(),
            label: `${durationLabel} — ${t.price} ${t.currency}`,
            duration_days: t.duration_days,
          };
        })
      );
      setVoucherCode(data.order.voucher_code ?? '');
      setUpdateError(null);
    } catch (err) {
      console.error(err);
      setUpdateError('Update failed');
    }
  };

  // ---------------- Handlers ----------------
  const handleTierChange = (opt: TierOption | null) => {
    if (!opt) return;
    updateOrderBackend({ duration_days: opt.duration_days });
  };

  const handleCurrencyChange = (opt: CurrencyOption | null) => {
    if (!opt) return;
    updateOrderBackend({ currency: opt.value });
  };

  const handleApplyVoucher = () => {
    updateOrderBackend({ voucher_code: voucherCode });
  };

  const handleRemoveVoucher = () => {
    updateOrderBackend({ voucher_code: null });
    setVoucherCode('');
  };

  const handleCheckout = async () => {
    if (!order) return;
    try {
      setCheckoutLoading(true);
      const res = await fetch(`/api/orders/initiate-payment/${order.id}`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'Неуспешно иницииране на плащането');
        return;
      }
      const data = await res.json()
      window.location.href = data.payment_url;
    } catch (err) {
      console.error(err);
      alert('Грешка при плащане');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading || !order) return <Spinner />;

  const now = new Date();
  const until = new Date(now.getTime() + order.price_tier.duration_days * 24 * 60 * 60 * 1000);

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
            value={currencyOptions.find(c => c.value === order.currency) || null}
            onChange={handleCurrencyChange}
            placeholder="Избери валута"
            isClearable={false}
            isSearchable={false}
          />
        </div>

        <div className={styles.selectWrapper}>
          <h2>План</h2>
          <ReactSelect
            options={tierOptions}
            value={order.price_tier ? tierOptions.find(o => o.value === order.price_tier.id.toString()) : null}
            onChange={handleTierChange}
            placeholder="Моля, изберете план"
          />
          {console.log(order.price_tier)}
          {order.price_tier && (
            <div className={styles.validityBox}>
              <h5>Поканата ще бъде активна</h5>
              <Input
                id="valid-from"
                name="valid-from"
                label="От"
                value={formatDateTime(now)}
                disabled
              />
              <Input
                id="valid-until"
                name="valid-until"
                label="До"
                value={until ? formatDateTime(until) : ''}
                disabled
              />
            </div>
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
          {updateError && <p className={styles.error}>{updateError}</p>}
        </div>

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
