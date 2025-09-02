"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactSelect from "@/ui-components/Select/ReactSelect";
import Pagination from "@/ui-components/Pagination/Pagination";
import { Button } from "@/ui-components/Button/Button";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import styles from "./orders.module.css";
import type { components } from "@/shared/types";

type Order = components["schemas"]["OrderRead"];
type OrderStatus = components["schemas"]["OrderStatus"];

const statusLabels: Record<OrderStatus, string> = {
  started: "Стартирана",
  paid: "Платена",
  cancelled: "Отказана",
};

const filterOptions = [
  { value: "all", label: "Всички" },
  { value: "started", label: "Стартирана" },
  { value: "paid", label: "Платени" },
  { value: "cancelled", label: "Отказани" },
];

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState(filterOptions[0]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?page=${page}&page_size=10`, {
          credentials: "include",
        });
        const data: { items: Order[]; total_pages: number } = await res.json();

        let filteredItems = data.items;
        if (selectedStatus.value !== "all") {
          filteredItems = filteredItems.filter(
            (order) => order.status === selectedStatus.value
          );
        }

        setOrders(filteredItems);
        setTotalPages(data.total_pages);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, selectedStatus]);

  const handleFilterChange = (option: { value: string; label: string } | null) => {
    setSelectedStatus(option || filterOptions[0]);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => setPage(newPage);

  return (
    <div className="container fullHeight centerWrapper">
      <div className={styles.orders}>
        <h1 className={styles.heading}>Вашите поръчки</h1>

        <div className={styles.filterControls}>
          <ReactSelect
            options={filterOptions}
            value={selectedStatus}
            onChange={handleFilterChange}
            placeholder="Филтър по статус"
            isClearable={false}
          />
        </div>

        {loading ? (
          <Spinner size={50} />
        ) : orders?.length === 0 ? (
          <p className={styles.message}>Няма поръчки</p>
        ) : (
          <>
            <ul className={styles.grid}>
              {orders?.map((order) => {
                const price = Number(order.total_price);
                const formattedPrice = Number.isNaN(price)
                  ? "—"
                  : price.toFixed(2);

                return (
                  <li key={order.order_number} className={styles.orderItem}>
                    <div className={styles.head}>
                      <h3>Поръчка</h3>
                      <div
                        className={`${styles.status} ${styles[`status-${order.status}`]}`}
                      >
                        <p>
                          {statusLabels[order.status as OrderStatus] ||
                            order.status}
                        </p>
                      </div>
                    </div>

                    <div className={styles.pair}>
                      <p>
                        <strong>Номер</strong>
                      </p>
                      <p>{order.order_number}</p>
                    </div>

                    <div className={styles.pair}>
                      <p>
                        <strong>Покана</strong>
                      </p>
                      <p>
                        {order.invitation_title
                          ? order.invitation_title.length > 15
                            ? order.invitation_title.slice(0, 15) + "…"
                            : order.invitation_title
                          : "—"}
                      </p>
                    </div>

                    <div className={`${styles.pair} ${styles.last}`}>
                      <p>
                        <strong>Цена</strong>
                      </p>
                      <p>{formattedPrice} лв</p>
                    </div>

                    <div className={styles.order_actions}>
                      <Button
                        variant="secondary"
                        size="large"
                        icon="receipt_long"
                        iconPosition="right"
                        onClick={() =>
                          router.push(`/profile/orders/${order.order_number}`)
                        }
                      >
                        Преглед
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
