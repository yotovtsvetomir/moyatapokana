'use client';

import { useState, useEffect } from 'react';
import { useProfileInvitations } from '@/context/ProfileInvitationsContext';
import ReactSelect from '@/ui-components/Select/ReactSelect';
import Pagination from '@/ui-components/Pagination/Pagination';
import { Button } from '@/ui-components/Button/Button';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './profile-invitations.module.css';
import type { components } from '@/shared/types';

type Invitation = components['schemas']['InvitationRead'];

const statusLabels: Record<string, string> = {
  draft: 'Чернова',
  active: 'Активна',
  expired: 'Изтекла',
};

const filterOptions = [
  { value: 'all', label: 'Всички' },
  { value: 'draft', label: 'Чернови' },
  { value: 'active', label: 'Активни' },
  { value: 'expired', label: 'Изтекли' },
];

export default function ProfileInvitationsList() {
  const { invitations, setInvitations, loading, setLoading } = useProfileInvitations();
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] = useState(filterOptions[0]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchInvitations = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/invitations?page=${page}&page_size=10`);
        const data: { items: Invitation[]; total_pages: number } = await res.json();

        let filteredItems = data.items;
        if (selectedStatus.value !== 'all') {
          filteredItems = filteredItems.filter(inv => inv.status === selectedStatus.value);
        }

        setInvitations(filteredItems);
        setTotalPages(data.total_pages);
      } catch (err) {
        console.error('Failed to fetch invitations:', err);
        setInvitations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [page, selectedStatus, setInvitations, setLoading]);

  const handleFilterChange = (option: { value: string; label: string } | null) => {
    setSelectedStatus(option || filterOptions[0]);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => setPage(newPage);

  return (
    <div className="container fullHeight centerWrapper">
      <div className={styles.invitations}>
        <h1 className={styles.heading}>Вашите покани</h1>

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
        ) : invitations.length === 0 ? (
          <p className={styles.message}>Все още нямате създадени покани.</p>
        ) : (
          <>
            <ul className={styles.grid}>
              {invitations.map((invitation: Invitation) => (
                <li key={invitation.id}>
                  <div className={styles.card}>
                    <div className={styles.cardInner}>
                      <div className={`${styles.statusBadge} ${styles[invitation.status]}`}>
                        <span>{statusLabels[invitation.status] || invitation.status}</span>
                      </div>

                      <div className={styles.thumbnailWrapper}>
                        {invitation.wallpaper ? (
                          <Image
                            src={invitation.wallpaper}
                            alt="Преглед на поканата"
                            fill
                            unoptimized
                            className={styles.thumbnail}
                          />
                        ) : (
                          <div className={styles.placeholder}>
                            <span className="material-symbols-outlined">wallpaper</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.cardContent}>
                        <h3 className={styles.heading}>
                          {invitation.title
                            ? invitation.title.length > 20
                              ? invitation.title.substring(0, 20) + '…'
                              : invitation.title
                            : 'Без заглавие'}
                        </h3>

                        {invitation.created_at && (
                          <p className={styles.cardDate}>
                            Създадена на:{' '}
                            {new Date(invitation.created_at).toLocaleDateString('bg-BG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <Button
                        variant="secondary"
                        size="large"
                        onClick={() => router.push(`/profile/invitations/${invitation.id}/`)}
                        icon="thumbnail_bar"
                        iconPosition="right"
                      >
                        Преглед
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
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
