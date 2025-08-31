'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import { Button } from '@/ui-components/Button/Button';
import styles from './guests.module.css';
import type { components } from '@/shared/types';

type RSVPWithStats = components['schemas']['RSVPWithStats'];

const menuMap: Record<string, { bgName: string; icon: string }> = {
  meat: { bgName: 'Месо', icon: 'outdoor_grill' },
  fish: { bgName: 'Риба', icon: 'phishing' },
  vegetarian: { bgName: 'Вегетарианско', icon: 'nutrition' },
  kid: { bgName: 'Детско меню', icon: 'child_care' },
};

export default function GuestsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<RSVPWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetch(`/api/invitations/${id}/rsvp`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!data) return <p>Няма отговорили гости.</p>;

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

        {/* Stats */}
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

          {data.ask_menu && (
            <>
              <h5>Менюта</h5>
              <ul>
                {Object.entries(data.stats.menu_counts).map(([menu, count]) => {
                  const menuInfo = menuMap[menu] || { bgName: menu, icon: 'nutrition' };
                  return (
                    <li key={menu}>
                      <div>
                        <span className="material-symbols-outlined">{menuInfo.icon}</span>
                        <span>{menuInfo.bgName}</span>
                      </div>
                      <b>{count}</b>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className={styles.replies}>
          <h5>Отговорили на поканата: {data.stats.total_attending}</h5>

          <Button
            variant="secondary"
            size="middle"
            width="100%"
            onClick={() => router.push(`/profile/invitations/${id}/guests/replies`)}
          >
            Подробен списък с гости
          </Button>
        </div>
      </div>
    </div>
  );
}
