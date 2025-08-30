'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import { Button } from '@/ui-components/Button/Button';
import Pagination from '@/ui-components/Pagination/Pagination';
import styles from './guests.module.css';
import type { components } from '@/shared/types';

type Guest = components['schemas']['GuestRead'];
type PaginatedGuests = components['schemas']['PaginatedResponse<GuestRead>'];
type RSVPWithStats = components['schemas']['RSVPWithStats'];

export default function GuestsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<RSVPWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetch(`/api/invitations/${id}/rsvp?page=${page}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [id, page]);

  if (loading) return <Spinner />;
  if (!data) return <p>Няма отговорили гости.</p>;

  const guests: PaginatedGuests = data.guests;

  return (
    <div className="container fullHeight centerWrapper">
      <div className={styles.guests}>
        <div className={styles.guests_actions}>
          <Button
            variant="ghost"
            size="middle"
            onClick={() => router.push(`/profile/invitations/${id}`)}
            width="47%"
            icon="arrow_back"
            iconPosition="left"
          >
            Назад
          </Button>
        </div>

        <h1>Гости</h1>

        <div className={styles.stats}>
          <ul>
            <li>
              <div>
                <span className="material-symbols-outlined">done_all</span>
                <span>Потвърдени</span>
              </div>
              <b>{data.stats.total_attending}</b>
            </li>
            <li>
              <div>
                <span className="material-symbols-outlined">groups</span>
                <span>Възрастни</span>
              </div>
              <b>{data.stats.total_adults}</b>
            </li>
            <li>
              <div>
                <span className="material-symbols-outlined">child_care</span>
                <span>Деца</span>
              </div>
              <b>{data.stats.total_kids}</b>
            </li>
          </ul>

          {data.stats.menu_counts && (
            <>
              <h5>Менюта</h5>
              <ul>
                {Object.entries(data.stats.menu_counts).map(([menu, count]) => (
                  <li key={menu}>
                    <div>
                      <span className="material-symbols-outlined">nutrition</span>
                      <span>{menu}</span>
                    </div>
                    <b>{count}</b>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className={styles.replies}>
          <h3>Отговорили на поканата</h3>
          <ul>
            {guests.items.map((guest: Guest) => (
              <li key={guest.id}>
                {guest.first_name} {guest.last_name} — {guest.guest_type}{' '}
                {guest.menu_choice ? `(Меню: ${guest.menu_choice})` : ''}
              </li>
            ))}
          </ul>

          <Pagination
            currentPage={guests.current_page}
            totalPages={guests.total_pages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>
    </div>
  );
}
