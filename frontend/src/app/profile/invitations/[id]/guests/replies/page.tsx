'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactSelect from '@/ui-components/Select/ReactSelect';
import { Input } from '@/ui-components/Input/Input';
import Pagination from '@/ui-components/Pagination/Pagination';
import Accordion from '@/ui-components/Accordion/Accordion';
import { Button } from '@/ui-components/Button/Button';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import styles from '../guests.module.css';
import type { components } from '@/shared/types';
import { useGuests } from '@/context/GuestsContext';

type Guest = components['schemas']['GuestRead'];

type Option = { value: string; label: string };

const menuMap: Record<string, { bgName: string; icon: string }> = {
  meat: { bgName: 'Месо', icon: 'outdoor_grill' },
  fish: { bgName: 'Риба', icon: 'phishing' },
  vegetarian: { bgName: 'Вегетарианско', icon: 'nutrition' },
  kid: { bgName: 'Детско меню', icon: 'child_care' },
};

const attendingOptions: Option[] = [
  { value: '', label: 'Всички' },
  { value: 'true', label: 'Присъстващи' },
  { value: 'false', label: 'Неприсъстващи' },
];

const orderingOptions: Option[] = [
  { value: '-created_at', label: 'Най-нови' },
  { value: 'created_at', label: 'Най-стари' },
];

export default function GuestsRepliesClient() {
  const router = useRouter();
  const { id } = useParams();
  const { guests: initialGuests, stats: initialStats } = useGuests();

  const [rsvps, setRsvps] = useState(initialGuests);
  const [stats, setStats] = useState(initialStats);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [attendingFilter, setAttendingFilter] = useState(attendingOptions[0]);
  const [orderingFilter, setOrderingFilter] = useState(orderingOptions[0]);
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch RSVPs on filter/page change
  useEffect(() => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (attendingFilter.value) params.append('attending', attendingFilter.value);
    if (orderingFilter.value) params.append('ordering', orderingFilter.value);

    setLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/invitations/rsvp/${id}/?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )
      .then(res => res.json())
      .then(data => {
        setRsvps(data.guests || null);
        setStats(data.stats || null);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, attendingFilter, orderingFilter, id]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="container fullHeight centerWrapper">
      <div className={styles.replies}>
        <div className={styles.guests_actions_top}>
          <Button
            variant="ghost"
            size="middle"
            onClick={() => router.push(`/profile/invitations/${id}/guests`)}
            width="47%"
            icon="arrow_back"
            iconPosition="left"
          >
            Назад
          </Button>
        </div>

        <h3>Отговорили на поканата: {stats?.total_attending ?? 0}</h3>

        {/* Filters */}
        <div className={styles.filters}>
          <ReactSelect
            options={attendingOptions}
            value={attendingFilter}
            onChange={(opt) => setAttendingFilter(opt || attendingOptions[0])}
            placeholder="Филтър по статус"
            isClearable={false}
          />
          <ReactSelect
            options={orderingOptions}
            value={orderingFilter}
            onChange={(opt) => setOrderingFilter(opt || orderingOptions[0])}
            placeholder="Подреди по дата"
            isClearable={false}
          />
          <Input
            id="guest-search"
            name="guest-search"
            value={searchQuery}
            onChange={handleSearchChange}
            label="Търсене по име"
            icon="search"
          />
        </div>

        {/* Spinner / Guest List */}
        {loading ? (
          <div className={styles.spinnerWrapper}>
            <Spinner />
          </div>
        ) : rsvps && rsvps.items.length > 0 ? (
          <ul>
            {rsvps.items.map((guest: Guest) => {
              const familyMembers = guest.sub_guests || [];
              return (
                <li key={guest.id} className={styles.replyItem}>
                  <div className={styles.replyHead}>
                    <div className={styles.replyPair}>
                      <span className="material-symbols-outlined">person</span>
                      <p>{guest.first_name} {guest.last_name}</p>
                    </div>
                    <div className={styles.replyPair}>
                      <span
                        className={`material-symbols-outlined ${
                          guest.attending ? styles.attending : styles.notAttending
                        }`}
                        title={guest.attending ? 'Присъства' : 'Не присъства'}
                      >
                        {guest.is_main_guest && (guest.sub_guests?.length ?? 0) > 0 ? 'groups' : 'person'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.mainGuestPair}>
                    <p><strong>Присъствие</strong></p>
                    <p>{guest.attending ? 'Да' : 'Не'}</p>
                  </div>

                  <div className={styles.mainGuestPair}>
                    <p><strong>Отговор</strong></p>
                    <p>{guest.created_at ? new Date(guest.created_at).toLocaleDateString('bg-BG') : '—'}</p>
                  </div>

                  {guest.menu_choice && menuMap[guest.menu_choice] && (
                    <div className={styles.mainGuestPair}>
                      <p><strong>Меню</strong></p>
                      <p className={styles.withIcon}>
                        <span className="material-symbols-outlined">{menuMap[guest.menu_choice].icon}</span>{' '}
                        <span>{menuMap[guest.menu_choice].bgName}</span>
                      </p>
                    </div>
                  )}

                  {familyMembers.length > 0 && (
                    <div className={styles.familyMembers}>
                      <Accordion title="Семейство">
                        <ul className={styles.familyList}>
                          {familyMembers.map((member, index) => (
                            <li key={member.id} className={styles.familyListItem}>
                              <p>{index + 1}.</p>
                              <div className={styles.familyGuestPair}>
                                <p><strong>Име</strong></p>
                                <p>{member.first_name} {member.last_name}</p>
                              </div>
                              <div className={styles.familyGuestPair}>
                                <p><strong>Възраст</strong></p>
                                <p>{member.guest_type === 'kid' ? 'дете' : 'възрастен'}</p>
                              </div>
                              {member.menu_choice && (
                                <div className={styles.familyGuestPair}>
                                  <p><strong>Меню</strong></p>
                                  <p className={styles.withIcon}>
                                    <span className="material-symbols-outlined">{menuMap[member.menu_choice]?.icon}</span>{' '}
                                    <span>{menuMap[member.menu_choice]?.bgName}</span>
                                  </p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </Accordion>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Няма отговорили гости.</p>
        )}

        {/* Pagination */}
        {rsvps && rsvps.total_pages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={rsvps.total_pages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
