'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import ReactSelect, { Option } from '@/ui-components/Select/ReactSelect';
import styles from './checkout.module.css';
import { components } from '@/shared/types';

type Order = components['schemas']['OrderRead'];
type PriceTier = components['schemas']['PriceTierRead'];

// --- Static Header ---
const CheckoutHeader = ({ order }: { order: Order }) => (
  <>
    {order.invitation_wallpaper && (
      <div className={styles.inviteWrapper}>
        <div className={styles.imageWrapper}>
          <Image src={order.invitation_wallpaper} alt="Invitation" fill className={styles.inviteImage} />
          <div className={styles.imageOverlay}>
            <h1 className={styles.title}>{order.invitation_title}</h1>
          </div>
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
  </>
);

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  const [currency, setCurrency] = useState<string>('BGN');
  const [currencyOptions, setCurrencyOptions] = useState<Option[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);

  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [validFromInput, setValidFromInput] = useState('');
  const [validUntilInput, setValidUntilInput] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const formatDateTime = (date: Date) => date.toISOString().slice(0, 16).replace('T', ' ');

  // --- Fetch Order ---
  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitation_id: Number(id) }),
        });
        if (!res.ok) throw new Error('Failed to fetch/create order');
        const data: Order = await res.json();
        setOrder(data);
        setValidFromInput(formatDateTime(new Date()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // --- Fetch Price Tiers ---
  useEffect(() => {
    if (!currency) return;
    const fetchTiers = async () => {
      try {
        const res = await fetch(`/api/orders/price-tiers/${currency}`);
        if (!res.ok) throw new Error('Failed to fetch price tiers');
        const data = await res.json();
        setPriceTiers(data.tiers);
        setCurrencyOptions(data.currencies.map((c: string) => ({ value: c, label: c })));
        // reset tier-dependent states
        setSelectedTierId(null);
        setCalculatedTotal(0);
        setDiscountAmount(0);
        setVoucherCode('');
        setValidUntilInput('');
        setUpdateError(null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTiers();
  }, [currency]);

  // --- Get currently selected tier object ---
  const selectedTier = priceTiers.find(t => t.id === selectedTierId) ?? null;

  // --- Update Valid Until whenever tier changes ---
  useEffect(() => {
    if (selectedTier) {
      const now = new Date();
      const until = new Date(now.getTime() + selectedTier.duration_days * 24 * 60 * 60 * 1000);
      setValidUntilInput(formatDateTime(until));
      setCalculatedTotal(selectedTier.price);
      setDiscountAmount(0);
      setVoucherCode('');
      setUpdateError(null);
    } else {
      setValidUntilInput('');
      setCalculatedTotal(0);
      setDiscountAmount(0);
    }
  }, [selectedTier]);

  // --- Apply Voucher ---
  const handleApplyVoucher = async () => {
    if (!order || !selectedTier || !voucherCode) return;
    try {
      const res = await fetch(`/api/orders/update/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          voucher_code: voucherCode,
          duration_days: selectedTier.duration_days,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setUpdateError(errData.detail || 'Неуспешно обновяване на поръчката');
        setDiscountAmount(0);
        setCalculatedTotal(selectedTier.price);
        return;
      }

      const updatedOrder: Order = await res.json();
      setOrder(updatedOrder);
      setCalculatedTotal(updatedOrder.total_price);
      setDiscountAmount(updatedOrder.discount_amount);
      setUpdateError(null);
    } catch (err) {
      console.error(err);
      setUpdateError('Грешка при прилагане на промо код');
    }
  };

  // --- Checkout ---
  const handleCheckout = async () => {
    if (!order) return;
    try {
      setCheckoutLoading(true);
      const res = await fetch(`/api/orders/${order.id}/initiate-payment`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'Неуспешно иницииране на плащането');
        return;
      }
      router.push(`/`);
    } catch (err) {
      console.error(err);
      alert('Грешка при плащане');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading || !order) return <Spinner />;

  return (
    <div className="container fullHeight centerWrapper steps">
      <div className={styles.checkout}>
        <h1>Поръчка - {order.order_number}</h1>
        <CheckoutHeader order={order} />

        {/* Currency */}
        <div className={styles.currencySelector}>
          <h2>Валута за плащане</h2>
          <ReactSelect
            options={currencyOptions}
            value={currencyOptions.find(c => c.value === currency) || null}
            onChange={(option) => option && setCurrency(option.value)}
            placeholder="Избери валута"
            isClearable={false}
            isSearchable={false}
          />
        </div>

        {/* Plan */}
        <div className={styles.selectWrapper}>
          <h2>План</h2>
          <ReactSelect
            options={priceTiers.map(t => ({
              value: t.id,
              label: `${t.duration_days} дни — ${t.price} ${t.currency}`,
            }))}
            value={selectedTier ? { value: selectedTier.id, label: `${selectedTier.duration_days} дни — ${selectedTier.price} ${selectedTier.currency}` } : null}
            onChange={(opt) => setSelectedTierId(opt?.value ?? null)}
            placeholder="Моля, изберете план"
          />

          {selectedTier && (
            <div className={styles.validityBox}>
              <h5>Поканата ще бъде активна</h5>
              <Input id="valid-from" name="valid-from" label="От" value={validFromInput} disabled />
              <Input id="valid-until" name="valid-until" label="До" value={validUntilInput} disabled />
            </div>
          )}
        </div>

        {/* Voucher */}
        <div className={styles.voucherWrapper}>
          <h2>Промо код</h2>
          <div>
            <Input id="voucher" name="voucher" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} />
            <Button
              size="large"
              width="100%"
              variant="primary"
              onClick={handleApplyVoucher}
              disabled={!voucherCode || !selectedTier}
            >
              Приложи
            </Button>
          </div>
          {updateError && <p className={styles.error}>{updateError}</p>}
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <h2>Общо</h2>

          <div className={styles.summaryRow}>
            <p>Оригинална цена:</p>
            <p>{selectedTier ? selectedTier.price.toFixed(2) : '0.00'} {selectedTier?.currency}</p>
          </div>

          <div className={styles.summaryRow}>
            <p>Отстъпка:</p>
            <p>{discountAmount.toFixed(2)} {selectedTier?.currency}</p>
          </div>

          <div className={styles.summaryRow}>
            <p><strong>Крайна цена:</strong></p>
            <p><strong>{calculatedTotal.toFixed(2)} {selectedTier?.currency}</strong></p>
          </div>
        </div>

        {/* Checkout */}
        <div className={styles.actions}>
          <Button onClick={handleCheckout} disabled={!selectedTier || checkoutLoading} width="100%" icon="payments" iconPosition="right" size="large">
            {checkoutLoading ? 'Обработване...' : 'Плати'}
          </Button>
        </div>
      </div>
    </div>
  );
}
