"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/ui-components/Button/Button";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import styles from "./order-detail.module.css";
import type { components } from "@/shared/types";

type Order = components["schemas"]["OrderRead"];
type OrderStatus = components["schemas"]["OrderStatus"];
type InvitationStatus = components["schemas"]["InvitationStatus"];

const ORDER_STATUS_LABELS_BG: Record<OrderStatus, string> = {
  started: "Стартирана",
  paid: "Платена",
  cancelled: "Отказана",
};

const INVITATION_STATUS_LABELS_BG: Record<InvitationStatus, string> = {
  draft: "Чернова",
  active: "Активна",
  expired: "Изтекла",
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

export default function OrderDetailPage() {
  const params = useParams<{ order_number: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const paymentStatus = searchParams.get("payment_status");

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${params.order_number}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch order");
        const data: Order = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.order_number]);

  const handleDownloadInvoice = async () => {
    try {
      const res = await fetch(`/api/orders/${params.order_number}/invoice`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to download invoice");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${params.order_number}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading invoice:", err);
    }
  };

  if (loading) {
    return (
      <div className="container fullHeight centerWrapper">
        <Spinner size={50} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container fullHeight centerWrapper">
        <p>Поръчката не беше намерена.</p>
      </div>
    );
  }

  return (
    <div className="container fullHeight centerWrapper">
      <div className={styles.orderDetail}>
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="middle"
            onClick={() => router.push("/profile/orders")}
            width="47%"
            icon="arrow_back"
            iconPosition="left"
          >
            Назад
          </Button>
        </div>

        <h2>Детайли за поръчка - {order.order_number}</h2>

        <div className={styles.info}>
          <div className={styles.pair}>
            <p><strong>Номер на поръчката</strong></p>
            <p>{order.order_number}</p>
          </div>

          <div className={`${styles.pair} ${styles.last}`}>
            <p><strong>Създадена на</strong></p>
            <p>{order.created_at ? formatDateTime(order.created_at) : "—"}</p>
          </div>

          <div className={`${styles.pair} ${styles.last}`}>
            <p><strong>Създадена от</strong></p>
            <p>{order.customer_name}</p>
          </div>

          <div className={styles.pair}>
            <p><strong>Статус на поръчката</strong></p>
            <p>{ORDER_STATUS_LABELS_BG[order.status] || order.status}</p>
          </div>

          <div className={`${styles.pair} ${styles.last}`}>
            <p><strong>Цена</strong></p>
            <p>
              {order.total_price}{" "}
              {{
                BGN: "лв",
                EUR: "€",
              }[order.currency] || order.currency}
            </p>
          </div>

          <div className={styles.pair}>
            <p><strong>Номер на поканата</strong></p>
            <p>{order.invitation_id}</p>
          </div>

          <div className={styles.pair}>
            <p><strong>Заглавие на поканата</strong></p>
            <p>{order.invitation_title}</p>
          </div>

          <div className={styles.pair}>
            <p><strong>Статус на поканата</strong></p>
            <p>
              {order.invitation_status &&
              INVITATION_STATUS_LABELS_BG[order.invitation_status]
                ? INVITATION_STATUS_LABELS_BG[order.invitation_status]
                : order.invitation_status || "—"}
            </p>
          </div>

          <div className={`${styles.pair} ${styles.last}`}>
            <p><strong>Платена на</strong></p>
            <p>{order.paid_at ? formatDateTime(order.paid_at) : "—"}</p>
          </div>

          <div className={`${styles.pair} ${styles.last}`}>
            <p><strong>Aктивна от</strong></p>
            <p>
              {order.invitation_is_active && order.invitation_active_from
                ? formatDateTime(order.invitation_active_from)
                : "—"}
            </p>
          </div>

          <div className={`${styles.pair} ${styles.last}`}>
            <p><strong>Aктивна до</strong></p>
            <p>
              {order.invitation_is_active && order.invitation_active_until
                ? formatDateTime(order.invitation_active_until)
                : "—"}
            </p>
          </div>
        </div>

        <div className={styles.bottomActions}>
          {order.paid && (
            <Button
              variant="primary"
              icon="picture_as_pdf"
              iconPosition="right"
              width="100%"
              size="large"
              onClick={handleDownloadInvoice}
            >
              Изтегли фактура
            </Button>
          )}

          {!order.paid && (
            <Link href={`/checkout/${order.invitation_id}`}>
              <Button
                variant="secondary"
                icon="payments"
                iconPosition="right"
                width="100%"
                size="large"
              >
                Купи
              </Button>
            </Link>
          )}

          <Link href={`/profile/invitations/${order.invitation_id}`}>
            <Button
              variant="secondary"
              icon="mail"
              iconPosition="right"
              width="100%"
              size="large"
            >
              Към поканата
            </Button>
          </Link>

          {paymentStatus === "success" && (
            <div className={styles.paymentStatusMessageSuccess}>
              <p>Плащането беше успешно. Благодарим ви!</p>
            </div>
          )}

          {paymentStatus === "cancel" && (
            <div className={styles.paymentStatusMessageError}>
              <p>Плащането беше отказано. Можете да опитате отново.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
