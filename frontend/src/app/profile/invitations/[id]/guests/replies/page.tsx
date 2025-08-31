'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactSelect from '@/ui-components/Select/ReactSelect';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import { Button } from '@/ui-components/Button/Button';
import Pagination from '@/ui-components/Pagination/Pagination';
import { Input } from '@/ui-components/Input/Input';
import Accordion from '@/ui-components/Accordion/Accordion';
import styles from '../guests.module.css';
import type { components } from '@/shared/types';

type Guest = components['schemas']['GuestRead'];
type PaginatedGuests = components['schemas']['PaginatedResponse<GuestRead>'];
type RSVPWithStats = components['schemas']['RSVPWithStats'];

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

export default function GuestsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [rsvps, setRsvps] = useState<PaginatedGuests | null>(null);
  const [stats, setStats] = useState<RSVPWithStats['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [attendingFilter, setAttendingFilter] = useState(attendingOptions[0]);
  const [orderingFilter, setOrderingFilter] = useState(orderingOptions[0]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // reset page on new search
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch RSVPs whenever filters/page change
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (attendingFilter.value) params.append('attending', attendingFilter.value);
    if (orderingFilter.value) params.append('ordering', orderingFilter.value);

    fetch(`/api/invitations/${id}/rsvp?${params.toString()}`)
      .then(res => res.json())
      .then((data) => {
        setRsvps(data.guests || null);
        setStats(data.stats || null);
      })
      .finally(() => setLoading(false));
  }, [id, page, debouncedSearch, attendingFilter, orderingFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="container fullHeight centerWrapper">
      <div className={styles.replies}>
        <div className={styles.guests_actions}>
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
                        {guest.is_main_guest && guest.sub_guests?.length > 0 ? 'groups' : 'person'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.mainGuestPair}>
                    <p><strong>Присъствие</strong></p>
                    <p>{guest.attending ? 'Да' : 'Не'}</p>
                  </div>

                  <div className={styles.mainGuestPair}>
                    <p><strong>Отговор</strong></p>
                    <p>{new Date(guest.created_at).toLocaleDateString('bg-BG')}</p>
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
