'use client';

import { useGuests } from "@/context/GuestsContext";
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/ui-components/Button/Button';
import styles from "./guests.module.css";

const menuMap: Record<string, { bgName: string; icon: string }> = {
  meat: { bgName: "Месо", icon: "outdoor_grill" },
  fish: { bgName: "Риба", icon: "phishing" },
  veg: { bgName: "Вегетарианско", icon: "nutrition" },
  kid: { bgName: "Детско меню", icon: "child_care" },
};


export default function GuestsPageClient() {
  const router = useRouter();
  const { id } = useParams();
  const { stats } = useGuests();

  if (!stats) return null;

  return (
    <div className="container fullHeight centerWrapper">
      <div className={styles.guests}>
        <div className={styles.guests_actions_top}>
          <Button
            variant="ghost"
            size="middle"
            width="47%"
            icon="arrow_back"
            iconPosition="left"
            onClick={() => router.back()}
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
                <span className="material-symbols-outlined">people</span>
                <span>Общо</span>
              </div>
              <b>{stats.total_guests}</b>
            </li>
            <li>
              <div>
                <span className="material-symbols-outlined">done_all</span>
                <span>Присъстващи</span>
              </div>
              <b>{stats.total_attending}</b>
            </li>
            <li>
              <div>
                <span className="material-symbols-outlined">close</span>
                <span>Неприсъстващи</span>
              </div>
              <b>{stats.total_not_attending}</b>
            </li>
          </ul>

          <ul>
            <li>
              <div>
                <span className="material-symbols-outlined">groups</span>
                <span>Възрастни</span>
              </div>
              <b>{stats.total_adults}</b>
            </li>
            <li>
              <div>
                <span className="material-symbols-outlined">child_care</span>
                <span>Деца</span>
              </div>
              <b>{stats.total_kids}</b>
            </li>
          </ul>

          {stats.menu_counts && Object.keys(stats.menu_counts).length > 0 && (
            <>
              <h5>Менюта</h5>
              <ul>
                {Object.entries(stats.menu_counts).map(([menu, count]) => {
                  const menuInfo = menuMap[menu] || { bgName: menu, icon: "nutrition" };
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

        <div className={styles.guests_actions_bottom}>
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
